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
    .select(`
      color_theme,
      business_visuals,
      storefront_architecture,
      interior_layout,
      brand_source,
      business_description,
      business_name,
      street,
      city,
      last_analyzed_business_name,
      last_analyzed_street,
      last_analyzed_city
    `)
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error("Error fetching brand identity:", error.message);
    return { 
      color_theme: null, 
      business_visuals: null,
      storefront_architecture: null,
      interior_layout: null,
      brand_source: null,
      business_description: null
    };
  }

  return {
    color_theme: data?.color_theme || null,
    business_visuals: data?.business_visuals || null,
    storefront_architecture: data?.storefront_architecture || null,
    interior_layout: data?.interior_layout || null,
    brand_source: data?.brand_source || null,
    business_description: data?.business_description || null,
    _stored_business_name: data?.business_name || null,
    _stored_street: data?.street || null,
    _stored_city: data?.city || null,
    last_analyzed_business_name: data?.last_analyzed_business_name || null,
    last_analyzed_street: data?.last_analyzed_street || null,
    last_analyzed_city: data?.last_analyzed_city || null,
  };
}


export function parseBusinessIntel(raw: string | null) {
  if (!raw) return null;
  
  try {
    // Attempt to parse the string as JSON
    const parsed = JSON.parse(raw);
    
    // Check if it has our new "neighbourhood" key to confirm it's the new format
    if (parsed && parsed.neighbourhood) {
      return {
        description: parsed.description || "",
        neighbourhood: parsed.neighbourhood || "",
        landmarks: Array.isArray(parsed.landmarks) ? parsed.landmarks : [],
        transit: Array.isArray(parsed.transit) ? parsed.transit : [],
        local_trends: Array.isArray(parsed.local_trends) ? parsed.local_trends : [],
        products_services: Array.isArray(parsed.products_services) ? parsed.products_services : [],
        isJson: true
      };
    }
  } catch (e) {
    // If parsing fails, it's a legacy plain-text description
  }

  // Fallback for Legacy/Plain Text users
  return {
    description: raw,
    neighbourhood: null,
    landmarks: [],
    transit: [],
    local_trends: [],
    products_services: [],
    isJson: false
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
    [CONTEXT]: "${businessName}" | ${fullAddress} | Photos: ${photoContext}

    [TASK]:
    1. googleSearch: cross-reference official website, Yelp, and social media.
    2. Identify the business's unique value proposition and who they serve.
    3. Extract the 5 most distinct products/services ("Hero" offerings).
    4. Verify exact neighbourhood name and 5 walking-distance landmarks.
    5. Identify 2 nearby transit routes and 2 current local vibe trends.

    [SOURCES]:
    - S1 (Photos): Authoritative for all visuals. Missing detail → "Not visible in photos".
    - S2 (Search): Authoritative for names, landmarks, services. Missing → "None identified".

    [OUTPUT]: Raw JSON only. No preamble, no markdown, no conversation.

    {
      "physical_details": {
        "description": "S2: 2-3 sentence unique value proposition.",
        "neighbourhood": "S2: exact neighbourhood name",
        "landmarks": ["S2: 5 verified landmarks"],
        "transit": ["S2: 2 verified routes"],
        "local_trends": ["S2: 2 local trends"],
        "products_services": ["S2: 5 hero offerings"]
      },
      "visuals": {
        "primary_color": "S1: dominant brand color from logo",
        "secondary_color": "S1: supporting color from logo/storefront",
        "accent_color": "S1: contrast or highlight color",
        "theme_description": "S1: 1-sentence palette and mood summary",
        "logo_colors": "S1: exact colors in logo",
        "storefront_colors": "S1: exterior/signage colors and facade materials",
        "storefront_architecture": {
          "building": "S1: e.g. single-storey stucco, floor-to-ceiling windows, red door",
          "features": "S2: e.g. covered patio with 6 chairs, corner unit, street-level signage"
        },
        "interior_colors": "S1: colors, lighting warmth, surface materials",
        "interior_layout": "S1: spatial arrangement (counter, ceiling, seating, floor)"
      }
    }

    Output ONLY the JSON object. No preamble, no conversation.
  `;

  const result = await model.generateContent([...imageParts, { text: textPrompt }]);
  const responseText = result.response.text();

  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error(`[Gemini Text] No JSON in response. Raw: ${responseText.slice(0, 300)}`);
  }
  
  let parsed: any;
  try {
    parsed = JSON.parse(jsonMatch[0]);
  } catch (parseErr) {
    // Log the exact failure point for debugging
    console.error(`[Gemini Text] JSON parse failed. Raw extract:`, jsonMatch[0].slice(0, 500));
    throw new Error(`[Gemini Text] Invalid JSON returned by model: ${(parseErr as Error).message}`);
  }
  return parsed;
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
    [TASK]: Research and estimate brand identity for "${businessName}" at "${fullAddress}".

    1. Cross-reference official website, Yelp, and social media.
    2. Extract top 5 hero products/services.
    3. Identify 5 walking-distance landmarks.
    4. Find exact neighbourhood name, 2 transit routes, 2 local vibe trends.
    5. Infer visual brand from web presence and business type.
      If data is missing — estimate from business type and neighbourhood vibe.

    [OUTPUT]: Raw JSON only. No preamble, no markdown.

    {
      "physical_details": {
        "description": "2-3 sentence unique value proposition.",
        "neighbourhood": "exact neighbourhood name",
        "landmarks": ["5 verified landmarks"],
        "transit": ["2 verified routes"],
        "local_trends": ["2 local trends"],
        "products_services": ["5 hero products/services"]
      },
      "visuals": {
        "primary_color": "inferred dominant color",
        "secondary_color": "inferred supporting color",
        "accent_color": "inferred accent color",
        "theme_description": "1-sentence visual vibe summary",
        "logo_colors": "colors likely used in logo",
        "storefront_colors": "typical facade colors for this business",
        "storefront_architecture": {
          "building": "e.g. 2-storey brick Victorian, large picture windows, black awning",
          "features": "e.g. sidewalk patio with 4 tables, bike rack, corner lot"
        },
        "interior_colors": "estimated interior palette",
        "interior_layout": "estimated spatial arrangement (counter, ceiling, seating, floor)"
      }
    }

    Output ONLY the JSON object. No preamble, no conversation.
  `;

  const result = await model.generateContent(prompt);
  const responseText = result.response.text();

  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error(`[Gemini Text] No JSON in response. Raw: ${responseText.slice(0, 300)}`);
  }
  
  let parsed: any;
  try {
    parsed = JSON.parse(jsonMatch[0]);
  } catch (parseErr) {
    // Log the exact failure point for debugging
    console.error(`[Gemini Text] JSON parse failed. Raw extract:`, jsonMatch[0].slice(0, 500));
    throw new Error(`[Gemini Text] Invalid JSON returned by model: ${(parseErr as Error).message}`);
  }
  return parsed;
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
  let visionSucceeded = false;

  // 1. Try Vision Path if photos exist
  if (photos.length > 0) {
    try {
      extractedData = await analyzePhotosWithGemini(photos, businessName, fullAddressString);
      visionSucceeded = true; 
    } catch (visionErr) {
      console.warn("⚠️ Vision Path failed. Falling back to Text Search.", visionErr);
      visionSucceeded = false;
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

    const phys = extractedData.physical_details;
    const vis = extractedData.visuals;

    const updatePayload: any = {

      business_description: JSON.stringify(phys), 

      color_theme: {
        primary: vis.primary_color || "neutral",
        secondary: vis.secondary_color || "neutral",
        accent: vis.accent_color || "neutral",
        description: vis.theme_description || "natural tones",
      },
      business_visuals: {
        logoColors: vis.logo_colors || "Not provided",
        storefrontColors: vis.storefront_colors || "Not provided",
        interiorColors: vis.interior_colors || "Not provided",
      },
      storefront_architecture: vis.storefront_architecture,
      interior_layout: vis.interior_layout,

      brand_source: (() => {
        if (!visionSucceeded || photos.length === 0) return "text_search";
        const visualFields = [
          vis.primary_color,
          vis.secondary_color,
          vis.logo_colors,
          vis.storefront_colors,
          vis.interior_colors,
          vis.interior_layout,
        ];
        const blindCount = visualFields.filter(
          (f) => !f || f.trim().toLowerCase().startsWith("not visible")
        ).length;
        return blindCount >= 2 ? "text_search" : "photos";
      })(),

      last_analyzed_business_name: businessName,
      last_analyzed_street: address.street,
      last_analyzed_city: address.city,
    };

    const { error: updateError } = await supabase
      .from("profiles")
      .update(updatePayload)
      .eq("id", userId);

    if (updateError) throw updateError;
    console.log(`--- [BACKGROUND] SUCCESS: Brand analysis (${updatePayload.brand_source}) complete for ${businessName} ---`);

  } catch (saveErr) {
    console.error("--- [BACKGROUND] SAVE FAILED ---", saveErr);
      await supabase
      .from("profiles")
      .update({
        last_analyzed_business_name: businessName,
        last_analyzed_street: address.street,
        last_analyzed_city: address.city,
      })
      .eq("id", userId);

    throw saveErr;
  }
}