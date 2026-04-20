import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { BusinessIdentity, ColorTheme, BusinessVisuals } from '@/lib/constants';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * THE LIGHT READER (Fast Path)
 * Purpose: To be called during the critical path of text generation.
 * It only reads from the database. It never waits for Google Search.
 */
export async function getBrandIdentity(userId: string): Promise<BusinessIdentity> {
  const { data, error } = await supabase
    .from('profiles')
    .select('color_theme, business_visuals')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error("Error fetching brand identity:", error.message);
    return { color_theme: null, business_visuals: null };
  }

  return {
    color_theme: data?.color_theme || null,
    business_visuals: data?.business_visuals || null
  };
}

/**
 * THE HEAVY RESEARCHER (Slow Path)
 * Purpose: To be called in the background AFTER the user has their content.
 * It performs the Google Search, parses the results, and updates the DB.
 */
export async function discoverAndSaveBrandIdentity(
  userId: string, 
  businessName: string, 
  location: string
): Promise<void> {
  
  console.log(`--- [BACKGROUND] BRAND DISCOVERY STARTED FOR ${businessName} ---`);
  
  const tools = [{ googleSearch: {} }] as any;
  const model = genAI.getGenerativeModel({ 
    model: "models/gemma-4-26b-a4b-it", 
    tools: tools
  }, { apiVersion: 'v1beta' });

  const discoveryPrompt = `
    Search for the business "${businessName}" located in "${location}".
    Your goal is to identify their visual brand identity.

    STRICT OUTPUT REQUIREMENT:
    You MUST return a JSON object with exactly these 7 keys. 
    Do not use nested objects. Do not omit any keys. 
    If you cannot find a specific detail, use a professional estimate based on the brand's vibe.

    REQUIRED FLAT JSON STRUCTURE:
    {
      "primary_color": "the dominant color (e.g., 'Navy Blue')",
      "secondary_color": "the supporting color",
      "accent_color": "the contrast color",
      "theme_description": "a 1-sentence summary of the color palette",
      "logo_colors": "description of logo colors",
      "storefront_colors": "description of storefront",
      "interior_colors": "description of interior"
    }

    INSTRUCTIONS:
    1. Search for "${businessName}" at "${location}".
    2. If exact colors aren't found, use "Thematic Inference" (e.g., 'Nautical' $\rightarrow$ Blues/Whites).
    3. Output ONLY the JSON object. No preamble, no conversation.
  `;

  try {
    const result = await model.generateContent(discoveryPrompt);
    const responseText = result.response.text();
    
    let extractedData: any = null;

    // Robust JSON extraction using non-greedy regex to handle "chatty" AI
    const jsonRegex = /\{[\s\S]*?\}/g;
    const matches = responseText.match(jsonRegex);

    if (matches && matches.length > 0) {
      const lastJsonString = matches[matches.length - 1];
      extractedData = JSON.parse(lastJsonString);
    } else {
      throw new Error("No JSON object found in AI response.");
    }

    // RECONSTRUCTION: Convert the "Flat" AI response into your "Nested" DB structure
    const updatePayload: any = {};

    if (extractedData.primary_color || extractedData.theme_description) {
      updatePayload.color_theme = {
        primary: extractedData.primary_color || "neutral",
        secondary: extractedData.secondary_color || "neutral",
        accent: extractedData.accent_color || "neutral",
        description: extractedData.theme_description || "natural tones"
      };
    }

    if (extractedData.logo_colors || extractedData.storefront_colors || extractedData.interior_colors) {
      updatePayload.business_visuals = {
        logoColors: extractedData.logo_colors || "Not provided",
        storefrontColors: extractedData.storefront_colors || "Not provided",
        interiorColors: extractedData.interior_colors || "Not provided"
      };
    }

    if (Object.keys(updatePayload).length > 0) {
      const { error: updateError } = await supabase
        .from('profiles')
        .update(updatePayload)
        .eq('id', userId);

      if (updateError) throw updateError;
      console.log("--- [BACKGROUND] BRAND DISCOVERY SAVED SUCCESSFULLY ---");
    }
  } catch (err) {
    console.error("--- [BACKGROUND] BRAND DISCOVERY FAILED ---", err);
  }
}