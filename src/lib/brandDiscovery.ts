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
  url: string;      // Public Supabase URL to the image
  mimeType: string; // e.g. "image/jpeg"
  label: string;    // "storefront" | "logo" | "interior"
}

// HELPER: Fetches an image from a public URL and converts it to Gemini's inlineData format
async function urlToGenerativePart(url: string, mimeType: string) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Failed to fetch image from URL: ${url}. Status: ${response.status}`);
      throw new Error(`Failed to fetch image from URL: ${url}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    // Use Node.js Buffer to convert ArrayBuffer to Base64
    const base64Data = Buffer.from(arrayBuffer).toString('base64');
    
    return {
      inlineData: {
        data: base64Data,
        mimeType: mimeType,
      },
    };
  } catch (error) {
    console.error(`Error converting URL to Generative Part for ${url}:`, error);
    throw error; // Re-throw to propagate the error
  }
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
  const model = genAI.getGenerativeModel({ model: "models/gemini-2.5-flash", tools: [{ googleSearch: {} }] as any, }, { apiVersion: "v1beta" });

 // FIX: Fetch images from URLs and convert to base64 INTERNALLY
  const imageParts = await Promise.all(
    photos.map(photo => urlToGenerativePart(photo.url, photo.mimeType))
  );

  const photoContext = photos.length > 0
  ? photos.map((p, i) => `Photo ${i + 1}: ${p.label}`).join(", ")
  : "No photos provided";

  const textPrompt = `
    [ROLE]: Brand Analyst
    [CONTEXT]: Business: "${businessName}" | Address: "${fullAddress}" | Photos: ${photoContext}

    [DATA_SOURCES]:
    - S1 (Photos): Authoritative for all visual assets. If a detail is missing, use "Not visible in photos".
    - S2 (Search): googleSearch for "${businessName}" at "${fullAddress}". Use ONLY for "storefront_architecture.features" (e.g., patio, seating, landmarks, waterfront, corner location). If missing, use "None identified".

    [OUTPUT_RULES]:
    - Return ONLY a raw JSON object. 
    - No preamble, no markdown fences, no conversation.
    - Strict adherence to the following schema:

    {
      "primary_color": "S1: dominant brand color from logo",
      "secondary_color": "S1: supporting color from logo/storefront",
      "accent_color": "S1: contrast or highlight color",
      "theme_description": "S1: 1-sentence summary of visual palette and mood",
      "logo_colors": "S1: exact colors seen in logo",
      "storefront_colors": "S1: exterior/signage colors and facade materials",
      "storefront_architecture": {
        "building": "S1: type, material, window/door style, scale",
        "features": "S2: patio, seating, visible landmarks, location type"
      },
      "interior_colors": "S1: colors, lighting warmth, surface materials",
      "interior_layout": "S1: spatial arrangement (counter, ceiling, seating, floor)",
      "business_description": "S2: 2-3 sentence overview of business, what it does and its vibe"
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
    [TASK]: Research and estimate visual brand identity for "${businessName}" at "${fullAddress}".

    [LOGIC]: 
    - Base analysis on web research. 
    - If data is missing, use "Thematic Inference": provide professional estimates based on the business type and neighbourhood vibe.

    [OUTPUT]: 
    - Return ONLY a raw JSON object. No preamble, no markdown, no conversation.
    - Structure exactly as follows:

    {
      "primary_color": "dominant brand color",
      "secondary_color": "supporting brand color",
      "accent_color": "contrast/highlight color",
      "theme_description": "1-sentence summary of color palette",
      "logo_colors": "colors seen/inferred from logo",
      "storefront_colors": "exterior colors and facade materials",
      "storefront_architecture": {
        "building": "type, material, window/door style",
        "features": "patio, seating, landmarks, etc. (or 'None identified')"
      },
      "interior_colors": "interior colors and lighting warmth",
      "interior_layout": "spatial feel and layout based on business type",
      "business_description": "2-3 sentence overview of of what they do and what makes them unique."
    }
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