// brandDiscovery.ts

import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { BusinessIdentity } from '@/lib/constants';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ---------------------------------------------------------------------------
// TYPES
// ---------------------------------------------------------------------------

export interface UploadedPhoto {
  base64: string;   // Pure base64 string
  mimeType: string; // e.g. "image/jpeg"
  label: string;    // "storefront" | "logo" | "interior"
}

// ---------------------------------------------------------------------------
// THE LIGHT READER (Fast Path)
// ---------------------------------------------------------------------------

export async function getBrandIdentity(userId: string): Promise<BusinessIdentity> {
  const { data, error } = await supabase
    .from('profiles')
    .select('color_theme, business_visuals, storefront_architecture, interior_layout')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error("Error fetching brand identity:", error.message);
    return { 
      color_theme: null, 
      business_visuals: null,
      storefront_architecture: null,
      interior_layout: null
    };
  }

  return {
    color_theme: data?.color_theme || null,
    business_visuals: data?.business_visuals || null,
    storefront_architecture: data?.storefront_architecture || null,
    interior_layout: data?.interior_layout || null,
  };
}

// ---------------------------------------------------------------------------
// PATH A: Gemini Vision Analysis
// ---------------------------------------------------------------------------

async function analyzePhotosWithGemini(
  photos: UploadedPhoto[],
  businessName: string,
  fullAddress: string
): Promise<any> {
  console.log(`[Gemini Vision] Analyzing ${photos.length} uploaded photos for ${businessName}...`);

  // FIX: Explicitly use v1 for stable models like Flash to avoid 404 errors
  const model = genAI.getGenerativeModel({ model: "models/gemini-2.5-flash" }, { apiVersion: "v1beta" });

  const imageParts = photos.map((photo) => ({
    inlineData: {
      data: photo.base64,
      mimeType: photo.mimeType,
    },
  }));

  const photoContext = photos
    .map((p, i) => `Photo ${i + 1}: ${p.label}`)
    .join(", ");

  const textPrompt = `
    Analyze these photos of "${businessName}" (${fullAddress}): ${photoContext}.

    STRICT OUTPUT REQUIREMENT:
    Return a JSON object with exactly 10 keys. 
    Do not use nested objects. Do not omit any keys.

    1. PHOTO 1 (Storefront): Architecture, facade materials, and exterior colors.
    2. PHOTO 2 (Logo): Exact brand palette (Primary/Secondary colors).
    3. PHOTO 3 (Interior): Spatial layout, lighting warmth, and surface materials.

    REQUIRED FLAT JSON STRUCTURE:
    {
      "primary_color": "dominant brand color from logo",
      "secondary_color": "supporting color from logo",
      "accent_color": "contrast color from logo or storefront",
      "theme_description": "1-sentence summary of mood and palette",
      "logo_colors": "colors seen in the logo photo",
      "storefront_colors": "exterior colors and signage",
      "storefront_architecture": "building type, facade material, window/door style",
      "interior_colors": "interior colors and lighting warmth",
      "interior_layout": "spatial arrangement (e.g. counter location, seating)",
      "business_description": "2-3 sentence overview of the business and its vibe"
    }

    Output ONLY the JSON object. No preamble, no conversation.
  `;

  const result = await model.generateContent([...imageParts, { text: textPrompt }]);
  const responseText = result.response.text();

  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error(`[Gemini Vision] No JSON in response. Raw: ${responseText.slice(0, 300)}`);
  }

  console.log("[Gemini Vision] Analysis complete ✅");
  return JSON.parse(jsonMatch[0]);
}

// ---------------------------------------------------------------------------
// PATH B: Gemini Text Search Fallback
// ---------------------------------------------------------------------------

async function analyzeWithTextSearch(
  businessName: string,
  fullAddress: string
): Promise<any> {
  console.log(`[Gemini Text] Running text search fallback for ${businessName}...`);

  // FIX: Tools like Google Search require v1beta
  const model = genAI.getGenerativeModel(
    { model: "models/gemma-4-31b-it", tools: [{ googleSearch: {} }] as any },
    { apiVersion: "v1beta" }
  );

  const prompt = `
    Search for "${businessName}" at "${fullAddress}".
    Estimate their visual identity and return a JSON object with exactly 10 keys:
    primary_color, secondary_color, accent_color, theme_description, logo_colors, 
    storefront_colors, storefront_architecture, interior_colors, interior_layout, business_description.
    Output ONLY the JSON object.
  `;

  const result = await model.generateContent(prompt);
  const responseText = result.response.text();

  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error(`[Gemini Text] No JSON in response. Raw: ${responseText.slice(0, 300)}`);
  }

  console.log("[Gemini Text] Fallback analysis complete ✅");
  return JSON.parse(jsonMatch[0]);
}

// ---------------------------------------------------------------------------
// THE HEAVY RESEARCHER (Orchestrator)
// ---------------------------------------------------------------------------

export async function discoverAndSaveBrandIdentity(
  userId: string,
  businessName: string,
  address: {
    street: string;
    city: string;
    province_state: string;
    country: string;
    postalCode: string;
  },
  photos: UploadedPhoto[] = []
): Promise<void> {
  console.log(`--- [BACKGROUND] BRAND DISCOVERY STARTED FOR: ${businessName} ---`);

  const fullAddressString = `${address.street}, ${address.city}, ${address.province_state}, ${address.country} ${address.postalCode}`;
  let extractedData: any = null;

  // 1. Try Vision Path if photos exist
  if (photos.length > 0) {
    try {
      extractedData = await analyzePhotosWithGemini(photos, businessName, fullAddressString);
    } catch (visionErr) {
      console.warn("⚠️ Vision Path failed. Falling back to Text Search.", visionErr);
      // Fall through to Path B
    }
  }

  // 2. Fallback to Text Path if Vision failed or was skipped
  if (!extractedData) {
    try {
      extractedData = await analyzeWithTextSearch(businessName, fullAddressString);
    } catch (textErr) {
      console.error("❌ Both Vision and Text paths failed.");
      throw textErr; // Re-throw to signal real failure
    }
  }

  // 3. Reconstruct and Save
  try {
    const updatePayload: any = {
      business_description: extractedData.business_description,
      color_theme: {
        primary: extractedData.primary_color || "neutral",
        secondary: extractedData.secondary_color || "neutral",
        accent: extractedData.accent_color || "neutral",
        description: extractedData.theme_description || "natural tones",
      },
      business_visuals: {
        logoColors: extractedData.logo_colors || "Not provided",
        storefrontColors: extractedData.storefront_colors || "Not provided",
        interiorColors: extractedData.interior_colors || "Not provided",
      },
      storefront_architecture: extractedData.storefront_architecture,
      interior_layout: extractedData.interior_layout,
      brand_source: (photos.length > 0 && extractedData.primary_color) ? "photos" : "text_search"
    };

    const { error: updateError } = await supabase
      .from("profiles")
      .update(updatePayload)
      .eq("id", userId);

    if (updateError) throw updateError;
    console.log(`--- [BACKGROUND] SUCCESS: Saved via ${updatePayload.brand_source} ---`);

  } catch (saveErr) {
    console.error("--- [BACKGROUND] SAVE FAILED ---", saveErr);
    throw saveErr;
  }
}