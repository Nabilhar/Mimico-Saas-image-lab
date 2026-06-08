// brandDiscovery.ts

import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { BusinessIdentity } from '@/lib/constants';
import { 
  extractOfferingNames, 
  extractPracticesByOffering,
  parseInteriorLayout,
  parseExteriorLayout,
  parseZones
} from './parse-business-intel';

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
// JSON EXTRACTOR — Balanced-brace extraction, immune to trailing content
// ---------------------------------------------------------------------------
// Greedy regex (\{[\s\S]*\}) fails when the model appends explanation text or
// markdown fences after the closing brace — JSON.parse sees extra characters.
// This walks the string and stops at the exact closing brace of the outer object.

function extractJson(text: string): string | null {
  // Strip <think>...</think> blocks (DeepInfra/Gemini reasoning traces)
  // These appear before the real answer and contain a different JSON shape
  let cleaned = text.replace(/<think>[\s\S]*?<\/think>/g, "");

  // Strip markdown code fences
  cleaned = cleaned.replace(/^```(?:json)?\s*/m, "").replace(/\s*```\s*$/m, "");

  const start = cleaned.indexOf("{");
  if (start === -1) return null;
  let depth = 0;
  for (let i = start; i < cleaned.length; i++) {
    if (cleaned[i] === "{") depth++;
    else if (cleaned[i] === "}") {
      depth--;
      if (depth === 0) return cleaned.slice(start, i + 1);
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// CITATION STRIPPER — Removes <cite> tags that Haiku's web search tool adds
// ---------------------------------------------------------------------------
// This is the KEY FIX for the citation bleed issue.
// Haiku wraps search results in <cite index="..."> tags automatically.
// We extract the clean text and discard the citation markup.
 
function stripCitations(value: string | null | undefined): string | null {
  if (!value || typeof value !== "string") {
    return value || null;
  }
  
  const cleaned = value.replace(/<cite[^>]*>([^<]*)<\/cite>/g, "$1").trim();
  
  return cleaned || null;
}

// ---------------------------------------------------------------------------
// THE LIGHT READER (Fast Path)
// ---------------------------------------------------------------------------

export async function getBrandIdentity(businessId: string): Promise<BusinessIdentity> {
  const { data, error } = await supabase
    .from('businesses')
    .select(`
      color_theme,
      business_visuals,
      storefront_architecture,
      interior_layout,
      zones,
      brand_source,
      business_description,
      business_name,
      street,
      city,
      last_analyzed_business_name,
      last_analyzed_street,
      last_analyzed_city
    `)
    .eq('id', businessId)
    .maybeSingle();

  if (error) {
    console.error("Error fetching brand identity:", error.message);
    return { 
      color_theme: null, 
      business_visuals: null,
      storefront_architecture: null,
      interior_layout: null,
      zones: null,
      brand_source: null,
      business_description: null
    };
  }

  return {
    color_theme: data?.color_theme || null,
    business_visuals: data?.business_visuals || null,
    storefront_architecture: data?.storefront_architecture || null,
    interior_layout: data?.interior_layout || null,
    zones: data?.zones || null, 
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



export function parseBusinessIntel(raw: any) {
  if (!raw) return null;
  
  try {
    const parsed =
      typeof raw === "string"
        ? JSON.parse(raw)
        : raw;

      return {
        description:       parsed.description       || "",
        neighbourhood:     parsed.neighbourhood      || "",
        landmarks:         Array.isArray(parsed.landmarks)         ? parsed.landmarks         : [],
        transit:           Array.isArray(parsed.transit)           ? parsed.transit           : [],
        local_trends:      Array.isArray(parsed.local_trends)      ? parsed.local_trends      : [],

        products_services: extractOfferingNames(parsed.products_services),
        practices_by_offering: extractPracticesByOffering(parsed.products_services),
  

        interior_layout: parsed.interior_layout ? parseInteriorLayout(parsed.interior_layout) : undefined,
        storefront_architecture: parsed.storefront_architecture ? parseExteriorLayout(parsed.storefront_architecture) : undefined,

        zones: undefined, 

        isJson:            true,
        isInferred:        (parsed.description || "").startsWith("INFERRED:"),
      };

  } catch (e) {console.error("parseBusinessIntel failed:", e);}

  return {
    description:
      typeof raw === "string"
          ? raw
          : raw?.description || "",
    neighbourhood:     null,
    landmarks:         [],
    transit:           [],
    local_trends:      [],
    products_services: [],
    practices_by_offering: {}, 
    interior_layout:   undefined,
    storefront_architecture: undefined,
    zones:             undefined,
    isJson:            false,
    isInferred:        false,
  };
}

// ---------------------------------------------------------------------------
// PATH A: Gemini Vision Analysis
// Router → analyzeWithGoogle (primary) or analyzeWithDeepInfra (fallback)
// Env: VISION_ENGINE_MODE = TOGGLE | FALLBACK  (default: FALLBACK)
//      VISION_PROVIDER    = google | deepinfra  (used in TOGGLE mode only)
// ---------------------------------------------------------------------------

export async function analyzePhotosWithGemini(
  photos: UploadedPhoto[],
  businessName: string,
  fullAddress: string
): Promise<any> {
  const engineMode = process.env.VISION_ENGINE_MODE || "FALLBACK";

  if (engineMode === "TOGGLE") {
    const provider = process.env.VISION_PROVIDER || "google";
    console.log(`--- [VISION] MODE: TOGGLE [Using ${provider}] ---`);
    return provider === "deepinfra"
      ? analyzeWithDeepInfra(photos, businessName, fullAddress)
      : analyzeWithGoogle(photos, businessName, fullAddress);
  }

  // FALLBACK: try Google first, then DeepInfra
  console.log("--- [VISION] MODE: FALLBACK CHAIN (google → deepinfra) ---");
  try {
    const result = await analyzeWithGoogle(photos, businessName, fullAddress);
    console.log("--- [VISION] FALLBACK SUCCESS: google ---");
    return result;
  } catch (err) {
    console.warn("[VISION] google failed, trying deepinfra:", (err as Error).message);
    const result = await analyzeWithDeepInfra(photos, businessName, fullAddress);
    console.log("--- [VISION] FALLBACK SUCCESS: deepinfra ---");
    return result;
  }
}

// ---------------------------------------------------------------------------
// PATH A1: Google API (primary)
// ---------------------------------------------------------------------------

async function analyzeWithGoogle(
  photos: UploadedPhoto[],
  businessName: string,
  fullAddress: string
): Promise<any> {
  console.log(`[Vision/Google] Analyzing ${photos.length} photos for ${businessName}...`);

  // Vision only — no search tool
  const model = genAI.getGenerativeModel(
    { model: "models/gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
      },
    },
    { apiVersion: "v1beta" }
  );
  // Map photos to zones via label, regardless of array order
  const ZONE_ORDER = ["entrance", "customer_space", "work_space"] as const;
  const photosByZone: Record<string, UploadedPhoto | null> = {
    entrance: null,
    customer_space: null,
    work_space: null,
  };

  for (const photo of photos) {
    if (photo.label in photosByZone) {
      photosByZone[photo.label] = photo;
    }
  }

  // Interleave a zone header before each image so Gemini can't misread the order
  const interleavedParts: any[] = [];
  const photoContextLines: string[] = [];

  for (const zone of ZONE_ORDER) {
    const photo = photosByZone[zone];
    const zoneUpper = zone.toUpperCase();
    if (photo) {
      interleavedParts.push({ text: `\n[PHOTO FOR ZONE: ${zoneUpper}]\n` });
      interleavedParts.push(await urlToGenerativePart(photo.url, photo.mimeType));
      photoContextLines.push(`${zoneUpper}: provided`);
    } else {
      photoContextLines.push(`${zoneUpper}: NOT provided`);
    }
  }

  const photoContext = photoContextLines.join(", ");

  const textPrompt = buildVisionPrompt(businessName, fullAddress, photoContext);

  const result = await model.generateContent([...interleavedParts, { text: textPrompt }]);
  const responseText = result.response.text();

  console.log("\n========== VISION/GOOGLE RAW RESPONSE ==========");
  console.log(responseText);
  console.log("================================================\n");

  const jsonStr = extractJson(responseText);
  if (!jsonStr) {
    throw new Error(`[Vision/Google] No JSON in response. Raw: ${responseText.slice(0, 300)}`);
  }

  let parsed: any;
  try {
    parsed = JSON.parse(jsonStr);
  } catch (parseErr) {
    console.error(`[Vision/Google] JSON parse failed. Raw:`, jsonStr.slice(0, 500));
    throw new Error(`[Vision/Google] Invalid JSON: ${(parseErr as Error).message}`);
  }
  return parsed;
}

// ---------------------------------------------------------------------------
// PATH A2: DeepInfra (fallback) — OpenAI-compatible API, google/gemini-2.5-flash
// ---------------------------------------------------------------------------

async function analyzeWithDeepInfra(
  photos: UploadedPhoto[],
  businessName: string,
  fullAddress: string
): Promise<any> {
  console.log(`[Vision/DeepInfra] Analyzing ${photos.length} photos for ${businessName}...`);

  const ZONE_ORDER = ["entrance", "customer_space", "work_space"] as const;
  const photosByZone: Record<string, UploadedPhoto | null> = {
    entrance: null,
    customer_space: null,
    work_space: null,
  };

  for (const photo of photos) {
    if (photo.label in photosByZone) {
      photosByZone[photo.label] = photo;
    }
  }

  // Build content parts array: interleave zone headers + base64 images
  const contentParts: any[] = [];
  const photoContextLines: string[] = [];

  for (const zone of ZONE_ORDER) {
    const photo = photosByZone[zone];
    const zoneUpper = zone.toUpperCase();
    if (photo) {
      contentParts.push({ type: "text", text: `\n[PHOTO FOR ZONE: ${zoneUpper}]\n` });
      const { inlineData } = await urlToGenerativePart(photo.url, photo.mimeType);
      contentParts.push({
        type: "image_url",
        image_url: { url: `data:${inlineData.mimeType};base64,${inlineData.data}` },
      });
      photoContextLines.push(`${zoneUpper}: provided`);
    } else {
      photoContextLines.push(`${zoneUpper}: NOT provided`);
    }
  }

  const photoContext = photoContextLines.join(", ");

  // Append the full text prompt as the last part — same prompt as Google path
  // (reuse buildVisionPrompt so both paths stay in sync)
  contentParts.push({ type: "text", text: buildVisionPrompt(businessName, fullAddress, photoContext) });

  const response = await fetch("https://api.deepinfra.com/v1/openai/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.DEEPINFRA_API_KEY}`,
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "user",
          content: contentParts,
        },
      ],
      temperature: 0.2,
      max_tokens: 4096,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`[Vision/DeepInfra] HTTP ${response.status}: ${errText.slice(0, 300)}`);
  }

  const data = await response.json();
  const responseText = data.choices?.[0]?.message?.content;

  if (!responseText) {
    throw new Error(`[Vision/DeepInfra] Empty response. Full data: ${JSON.stringify(data).slice(0, 300)}`);
  }

  console.log("\n========== VISION/DEEPINFRA RAW RESPONSE ==========");
  console.log(responseText);
  console.log("====================================================\n");

  const jsonStr = extractJson(responseText);
  if (!jsonStr) {
    throw new Error(`[Vision/DeepInfra] No JSON in response. Raw: ${responseText.slice(0, 300)}`);
  }

  let parsed: any;
  try {
    parsed = JSON.parse(jsonStr);
  } catch (parseErr) {
    console.error(`[Vision/DeepInfra] JSON parse failed. Raw:`, jsonStr.slice(0, 500));
    throw new Error(`[Vision/DeepInfra] Invalid JSON: ${(parseErr as Error).message}`);
  }
  return parsed;
}

// ---------------------------------------------------------------------------
// SHARED: Vision prompt — used by both Google and DeepInfra paths
// ---------------------------------------------------------------------------

function buildVisionPrompt(businessName: string, fullAddress: string, photoContext: string): string {
  return `
    You are a professional brand photographer and visual analyst.
    Your only job is to extract visual identity information from these
    photos with the precision of an art director on a set walk.

    [CONTEXT]:
    Business: "${businessName}"
    Address: "${fullAddress}"
    Photos provided: ${photoContext}

    Each image in this request is preceded by a header indicating its zone:
      [PHOTO FOR ZONE: ENTRANCE]       — storefront, patio, reception, signage
      [PHOTO FOR ZONE: CUSTOMER_SPACE] — where the customer experience happens
      [PHOTO FOR ZONE: WORK_SPACE]     — where craft is performed

    Match each image to the zone in its header. Some zones may have no
    image — see "Photos provided" in [CONTEXT]. For zones without an
    image, return "Not visible in photos" for every field. Never fill
    gaps using other zones.

    [YOUR TASK]:
    1. Analyze each visible zone independently using the same method.
    2. Synthesize a global brand palette across all visible zones.
    3. Read only what is visible. Never guess. Never invent.
       Do not search the web.

    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    PER-ZONE METHOD — apply identically to all three zones
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    For each zone, extract two blocks: LAYOUT and COLORS.

    LAYOUT — describe the physical space:

      spatial_arrangement:
        How the zone is organized. Position and relationship of major elements.
        "Counter along left wall, 8 stools, seating area opposite"
        "Open patio with 4 metal tables, recessed entrance from sidewalk"
        "Linear prep line along back wall, two stations facing pass"

      focal_feature:
        The single most distinctive element — the thing the eye lands on first.
        "Exposed brick wall with framed black-and-white photos"
        "Hand-lettered vintage signage above the door"
        "Wood-fired oven dominating the back wall"

      materials_finishes:
        What surfaces are made of. Specific to texture, not just material category.
        "Reclaimed oak tables, leather banquettes, polished concrete floor"
        "Smooth stucco facade, dark powder-coated metal door, terracotta planters"
        "Stainless steel work surfaces, white subway tile splashback"

      lighting_mood:
        Light quality, temperature, source, abundance.
        "Warm pendant lights low over each table, dim ambient, intimate"
        "Awning-shaded natural light, glare-reduced at counter"
        "Bright fluorescent task lighting, no natural light visible"

      activity_zone:
        What happens in this zone — observed from the photo only.
        "Customer arrival, patio dining, foot traffic visible"
        "Customer seating, conversation, table service"
        "Active prep, line cooking, plating at pass"

    COLORS — describe the palette of this zone:

      Use precise color language — paint-professional, not generic.
      Not "blue" — "deep navy with slight grey undertone, cool"
      Not "brown" — "warm walnut, medium saturation, matte finish"
      Not "white" — "warm off-white, slightly cream, neutral"

      dominant:
        The color that fills the most surface area in this zone.

      supporting:
        The second most present color — the one that backs up the dominant.

      accent:
        The punch color. The highlight. May appear in small surface area
        but draws the eye.

      materials_palette:
        Texture-aware color descriptions of the key surfaces in this zone.
        Each surface gets a precise color + finish description.
        "Countertop: vibrant cherry red laminate, warm, glossy.
         Counter base: rich walnut brown, matte.
         Walls: warm off-white, matte.
         Floor: warm beige ceramic tile with subtle variation."

    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    GLOBAL COLOR THEME — synthesize across all visible zones
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    After analyzing all zones, identify the brand palette that emerges
    across them. This is the through-line that ties every image of this
    business together — including detail shots that have no spatial context.

      primary:
        The color that appears most consistently across visible zones.

      secondary:
        The color that supports the primary across zones.

      accent:
        The shared highlight or punch color that appears in multiple zones.

      description:
        One sentence describing the palette mood —
        warm/cool, minimal/rich, industrial/organic, bold/restrained.

    If only one zone has photos, synthesize from that zone alone.
    If no zones have photos, return "Not visible in photos" for all fields.

    [RULES]:
    - Read only what is visible in the photos.
    - Use precise color language — not generic names.
    - If a zone has no photo, return "Not visible in photos" for every
      field in that zone. Never invent. Never borrow from other zones.
    - Never infer from business name, category, or address.
    - Never search the web.

    [OUTPUT]:
    Return ONLY a valid JSON object. No preamble. No markdown. No explanation.
    Start with { and end with }.

    {
      "color_theme": {
        "primary": "precise color description — hue, tone, temperature",
        "secondary": "precise color description or Not visible in photos",
        "accent": "precise color description or Not visible in photos",
        "description": "one sentence — overall palette mood"
      },
      "zones": {
        "entrance": {
          "layout": {
            "spatial_arrangement": "...",
            "focal_feature": "...",
            "materials_finishes": "...",
            "lighting_mood": "...",
            "activity_zone": "..."
          },
          "colors": {
            "dominant": "...",
            "supporting": "...",
            "accent": "...",
            "materials_palette": "..."
          }
        },
        "customer_space": {
          "layout": {
            "spatial_arrangement": "...",
            "focal_feature": "...",
            "materials_finishes": "...",
            "lighting_mood": "...",
            "activity_zone": "..."
          },
          "colors": {
            "dominant": "...",
            "supporting": "...",
            "accent": "...",
            "materials_palette": "..."
          }
        },
        "work_space": {
          "layout": {
            "spatial_arrangement": "...",
            "focal_feature": "...",
            "materials_finishes": "...",
            "lighting_mood": "...",
            "activity_zone": "..."
          },
          "colors": {
            "dominant": "...",
            "supporting": "...",
            "accent": "...",
            "materials_palette": "..."
          }
        }
      }
    }
    `;
}

// ---------------------------------------------------------------------------
// PATH B: Gemini Text Search Fallback
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// RESEARCH PROVIDER ROUTER
// ---------------------------------------------------------------------------

async function runResearchProvider(
  businessName: string,
  fullAddressString: string,
  category: string,
  niche: string
): Promise<any> {
  const provider = process.env.DISCOVERY_RESEARCH_PROVIDER || "gemma";
  const isProduction = process.env.NEXT_PUBLIC_APP_ENV === "production";

  console.log(`--- [DISCOVERY] Research provider: ${provider} ---`);

  const attempt = async () => {
    if (provider === "haiku") {
      return researchWithHaiku(businessName, fullAddressString, category, niche);
    }
    if (provider === "gemma") {
      return researchWithGemma(businessName, fullAddressString);
    }
    throw new Error(`Unsupported research provider: ${provider}`);
  };

  // In production: one automatic retry before failing (handles transient errors)
  if (isProduction) {
    try {
      return await attempt();
    } catch (err) {
      console.warn(`[RESEARCH] Attempt 1 failed, retrying in 2s:`, (err as Error).message);
      await new Promise(resolve => setTimeout(resolve, 2000));
      return await attempt();
    }
  }

  return attempt();
}

// ---------------------------------------------------------------------------
// PATH B1: Haiku + Web Search
// ---------------------------------------------------------------------------

async function researchWithHaiku(
  businessName: string,
  fullAddressString: string,
  category: string,
  niche: string
): Promise<any> {
  console.log(`[Haiku Research] Researching ${businessName}...`);

  const researchPrompt = buildResearchPrompt(
    businessName, 
    fullAddressString, 
    category, 
    niche
  );

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4096,
      "thinking": {
         "type": "disabled"
      },
      tools: [
        {
          type: "web_search_20250305",
          name: "web_search",
          "max_uses": 5,
          "user_location": {
              "type": "approximate",
              "city": "Toronto",
              "region": "Ontario, Canada"
          }
        }
      ],
      system: "You are a local business researcher. Output only valid JSON as specified. No preamble. No markdown. No citation tags. Never include <cite> or any HTML tags in your output values — extracted data only.",
      messages: [
        { role: "user", content: researchPrompt }
      ],
    }),
  });

  const raw = await response.text();
  console.log("[Haiku Research] Raw response length:", raw.length);
  
  const data = JSON.parse(raw);
  if (data.error) throw new Error(`Haiku error: ${data.error.message}`);

  // Extract text from content blocks
  // Haiku with tools returns mixed block types
  const textContent = data.content
    .filter((block: any) => block.type === "text")
    .map((block: any) => block.text)
    .join("");

  // 🔍 LOG 1: See the raw text BEFORE JSON extraction
  console.log("\n========== HAIKU RAW TEXT RESPONSE ==========");
  console.log(textContent);
  console.log("=============================================\n");

  const jsonMatch = textContent.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error(
      `[Haiku Research] No JSON found. Raw: ${textContent.slice(0, 300)}`
    );
  }

  // 🔍 LOG 2: See the extracted JSON string BEFORE parsing
  console.log("\n========== HAIKU EXTRACTED JSON ==========");
  console.log(jsonMatch[0]);
  console.log("==========================================\n");

  let parsed: any;
  try {
    parsed = JSON.parse(jsonMatch[0]);
  } catch (parseErr) {
    console.error("[Haiku Research] JSON parse failed:", jsonMatch[0].slice(0, 500));
    throw new Error(`[Haiku Research] Invalid JSON: ${(parseErr as Error).message}`);
  }

  // 🔍 LOG 3: See the parsed object structure
  console.log("\n========== HAIKU PARSED RESULT ==========");
  console.log(JSON.stringify(parsed, null, 2));
  console.log("=========================================\n");

  return parsed;
}

// ---------------------------------------------------------------------------
// PATH B2: Gemma 4 + Google Search (existing logic, cleaned up)
// ---------------------------------------------------------------------------

async function researchWithGemma(
  businessName: string,
  fullAddressString: string,
): Promise<any> {
  console.log(`[Gemma Research] Researching ${businessName}...`);

  // Gemma uses the same prompt — model agnostic
  const researchPrompt = buildResearchPrompt(
    businessName,
    fullAddressString,
    "",   // category not passed to Gemma version
    ""    // niche not passed to Gemma version
  );

  const model = genAI.getGenerativeModel(
    { 
      model: "models/gemma-4-31b-it", 
      tools: [{ googleSearch: {} }] as any 
    },
    { apiVersion: "v1beta" }
  );

  const result = await model.generateContent(researchPrompt);
  const responseText = result.response.text();

  // 🔍 LOG 1: See the raw text BEFORE JSON extraction
  console.log("\n========== GEMMA RAW TEXT RESPONSE ==========");
  console.log(responseText);
  console.log("=============================================\n");

  const groundingMeta = (result.response as any)
    .candidates?.[0]?.groundingMetadata?.webSearchQueries;
  if (groundingMeta) {
    console.log("[Gemma Research] Searched for:", groundingMeta);
  }

  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error(
      `[Gemma Research] No JSON found. Raw: ${responseText.slice(0, 300)}`
    );
  }

  // 🔍 LOG 2: See the extracted JSON string BEFORE parsing
  console.log("\n========== GEMMA EXTRACTED JSON ==========");
  console.log(jsonMatch[0]);
  console.log("==========================================\n");

  let parsed: any;
  try {
    parsed = JSON.parse(jsonMatch[0]);
  } catch (parseErr) {
    console.error("[Gemma Research] JSON parse failed:", jsonMatch[0].slice(0, 500));
    throw new Error(`[Gemma Research] Invalid JSON: ${(parseErr as Error).message}`);
  }

  // 🔍 LOG 3: See the parsed object structure
  console.log("\n========== GEMMA PARSED RESULT ==========");
  console.log(JSON.stringify(parsed, null, 2));
  console.log("=========================================\n");

  return parsed;
}

// ---------------------------------------------------------------------------
// RESEARCH PROMPT BUILDER
// Shared by both Haiku and Gemma providers
// ---------------------------------------------------------------------------

function buildResearchPrompt(
  businessName: string,
  fullAddressString: string,
  category: string,
  niche: string
): string {
  return `
You are researching a local business to build a content and contact 
profile for an AI social media writing platform.

The quality of your research directly determines the quality of 
every post written for this business — and whether we can reach 
the owner to help them.

[BUSINESS]:
Name: "${businessName}"
Address: "${fullAddressString}"
${category ? `Category: "${category}"` : ""}
${niche ? `Niche: "${niche}"` : ""}

[SEARCH INSTRUCTIONS]:
You have exactly 5 web searches. Use them strategically:

SEARCH 1 — WEBSITE: IDENTITY + OFFERINGS
Search the official website thoroughly. This powers TASK 1 
(identity_story) and TASK 2 (signature practices per offering).

IMPORTANT — Many service businesses have SEPARATE pages for each 
service or class type. Don't stop at the homepage or main services 
page. Look for:
  (a) About/Story pages for identity, history, character
  (b) Individual service/class pages for format, duration, process
  (c) Menu/catalog pages broken into categories

For fitness studios: check individual class type pages (Yoga page, 
Pilates page, etc.) — each typically has its own format details.

For restaurants: menu pages usually group items into categories — 
treat each category as a potential offering grouping.

For professional services: service line pages (Wills page, Real 
Estate page) describe their specific process for that area.

Extract thoroughly. This single search must give you enough detail 
to populate TASK 2's 3-6 offerings with practices each.

SEARCH 2 — LISTINGS & VALIDATION:
Search Google Business profile and Yelp listing together.
Extract: business description, category, hours, contact, highlighted services.
Use these to validate website claims and fill gaps.

SEARCH 3 — PRESS & LOCAL COVERAGE:
Search for: BlogTO, local press, neighbourhood blogs, opening announcements.
These often describe the craft in detail the business doesn't publish themselves.

SEARCH 4 — SOCIAL: BIO + CONTACT
Search Instagram, Facebook, LinkedIn for bio text describing the business
in their own words, plus contact handles. Bio text often reveals character
and positioning that the website doesn't articulate.

SEARCH 5 — NEIGHBOURHOOD CONTEXT:
Search Reddit local subreddits and community forums.
Extract: neighbourhood behaviour patterns, seasonal trends, foot traffic timing.
Return exactly 2 specific behavioural patterns the business owner would recognize.
See TASK 4 for quality examples — avoid aesthetic labels, focus on timing and behavior.

[EXTRACTION TASKS]:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TASK 1 — DESCRIPTION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Extract WHO this business is — 2-3 sentences capturing identity, history, 
and character. This sets the voice and tone for every post.

WHAT TO CAPTURE:
- Ownership: who runs it (family, solo, partnership, chain location)
- History: how long they've been operating, key milestones if notable
- Character: the overall style/vibe — pick from natural descriptors below
- What makes them recognizable in their market (without quality claims)

CHARACTER DESCRIPTORS (use whichever fit, never force):
- Age/tradition: old-school, traditional, modern, contemporary, heritage
- Price point: high-end, everyday, accessible, premium, budget-friendly
- Approach: artisanal, commercial, boutique, industrial, bespoke
- Atmosphere: bare-bones, polished, casual, formal, spa-like, clinical
- Market position: neighbourhood institution, hidden gem, destination, 
  workhorse, specialist, generalist
- Style: minimalist, ornate, rustic, sleek, cozy, no-frills

WHAT MAKES A GOOD IDENTITY_STORY:
- Specific (names, dates, real descriptors)
- Honest (not marketing language)
- Includes the recognizable character/positioning
- 2-3 sentences, ~50-80 words
- Does NOT include operational details (those go in signature_practices)

If you cannot identify a clear character from research, describe what IS 
visible (history, ownership) without forcing a character label. Better to 
have honest identity without character than invented vibe.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TASK 2 — OFFERINGS — SIGNATURE PRACTICES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Extract 3-6 distinct hero offerings, each with 2-5 signature practices.

━━━ WHAT QUALIFIES AS AN OFFERING ━━━

An offering is something a customer PAYS FOR or BOOKS — a specific 
product, service, or program with its own price point or sign-up flow.

✅ COUNTS as separate offerings:
- A salon's "Cut," "Color," and "Treatment" services
- A yoga studio's "Vinyasa," "Pilates," and "Barre" class types
- A bakery's "Bread," "Pastries," "Cakes," and "Catering"
- A law firm's "Wills," "Real Estate," and "Family Law" practice areas
- A coffee shop's "Espresso Drinks," "Pour Over," "Pastries," "Beans"

❌ DOES NOT count as an offering:
- Operating hours, location, parking, contact info (metadata)
- Amenities (coffee bar, mat rental, free wifi, restrooms)
- Loyalty programs, memberships, packages (pricing models, not products)
- Affiliated programs not part of the core business
- General buckets like "Fitness Classes" or "Services" — break them down

CRITICAL RULE: If a business has 5 distinct class types or service lines,
return 5 offerings. Do NOT collapse them into one generic bucket like
"Group Fitness Classes" or "Hair Services."

━━━ WHAT MAKES A SIGNATURE PRACTICE ━━━

A signature practice describes HOW the offering is delivered — the 
specific, observable approach that defines this business's version.

Each practice must be:
- Specific (contains a number, duration, name, or named method)
- Observable (a customer could verify it by visiting)
- Concrete (not aspirational or marketing language)
- 3-15 words long
- Operational (about HOW the work happens, not WHY)

CATEGORIES TO LOOK FOR:
- Timing: when things happen, how long things take
- Process: how things are made, sequence of steps
- Material: what they use, where it's sourced from
- Rule: customer-facing policies, constraints, requirements
- Format: class size, session length, group vs private
- Equipment: tools, stations, or systems that define the work

BAD EXAMPLES (do not include any of these patterns):
- "We use only the freshest ingredients" — vague, no specifics
- "Quality is our top priority" — claim, not practice
- "Family-owned business" — identity, wrong field
- "Made with love and care" — emotional, not observable
- "Coffee bar available before workouts" — amenity, not a practice
- "Mat rental for members" — amenity, not a practice
- "Multiple class times available" — schedule metadata, not a practice

If a practice could appear in any business's marketing, it is NOT 
a signature practice. Cut it.

━━━ EXAMPLES BY BUSINESS TYPE ━━━

FITNESS STUDIO (correctly broken into class types):
{
  "Vinyasa Yoga": [
    "60-minute heated flow at 85-90°F",
    "All-levels with modifications offered every pose",
    "Max 25 mats per class on first-come basis"
  ],
  "Reformer Pilates": [
    "8-person cap with individual spring-resistance equipment",
    "Instructor adjustments throughout 50-minute session",
    "Beginner-only Sunday morning slot"
  ],
  "Barre": [
    "45-minute low-impact format",
    "Ballet-inspired isometric holds at the barre",
    "Light hand weights and resistance bands provided"
  ],
  "Strength Training": [
    "Small-group 6-person cap",
    "Kettlebell and dumbbell circuits programmed weekly",
    "60-minute sessions with form-check checkpoints"
  ]
}

RESTAURANT / FOOD:
{
  "Shawarma Wraps": [
    "Marinated 24 hours before slow-roasting on vertical rotisserie",
    "Served with house-made garlic sauce or pomegranate molasses",
    "Available in chicken, beef, or mixed"
  ],
  "Shawarma Plates": [
    "Choice of three sides from rice, potatoes, salads, hummus",
    "All plates include garlic sauce and pickles standard",
    "Grilled chicken breast and baked fish fillet variants offered"
  ],
  "Grilled Skewers": [
    "Hand-shaped beef kabab with parsley and onions",
    "Shish tawook chicken skewers grilled to order",
    "Mix BBQ plate combines both with three sides"
  ]
}

PROFESSIONAL SERVICES (law, accounting, consulting):
{
  "Wills & Estates": [
    "Flat-fee pricing model published upfront",
    "Video consultation available for first meeting",
    "Two-meeting standard process from intake to signing"
  ],
  "Real Estate Transactions": [
    "Same-day document turnaround",
    "Title insurance handled in-house",
    "Evening signing appointments available"
  ]
}

RETAIL / PRODUCT:
{
  "Custom Framing": [
    "48-hour standard turnaround time",
    "Archival-grade materials used as standard",
    "In-store design consultation included"
  ],
  "Ready-Made Frames": [
    "Walk-in selection from 200+ styles",
    "Fit-while-you-wait service for standard sizes"
  ]
}

SALON / BEAUTY:
{
  "Precision Cuts": [
    "Dry-cut technique on natural growth pattern",
    "Bone-structure consultation before scissors touch hair",
    "90-minute new-client appointment standard"
  ],
  "Color": [
    "Hand-painted balayage as primary technique",
    "Bond-building treatment included in service",
    "Free toning refresh within two weeks"
  ]
}

━━━ QUANTITY GUIDANCE ━━━

Most local businesses have 3-6 hero offerings. Return that many.

If you find fewer than 3 distinct offerings after searching the website
and listings, search harder before settling. Many service businesses have
separate pages for each service line — don't stop at the homepage or 
main menu page.

If only 1 offering with only 1 practice is showing up in your research,
that is a signal to do another search, not to submit thin output.

If after thorough research the business genuinely has only 2 offerings
(e.g. a solo practitioner with 2 service areas), return 2. But the 
default expectation is 3-6 offerings with 2-4 practices each.

━━━ INFERENCE RULE ━━━

If a practice is strongly implied by the offering but not explicitly 
stated, you may include it with the "INFERRED: " prefix.

Example: A yoga studio menu listing "Heated Vinyasa" → 
"INFERRED: Studio heated for vinyasa sessions"

Use sparingly. Only when the inference is obvious from the offering 
category and would be observable by a customer on their first visit.

This data feeds Tip of the Day and Behind the Scenes posts. Quality 
here directly determines content quality.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TASK 3 — LOCAL GROUND TRUTH
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Exact neighbourhood name
- 5 specific named landmarks within 10-minute walk
- 2 specific named transit routes serving this address

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TASK 4 — NEIGHBOURHOOD BEHAVIOUR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Return behavioural patterns — not aesthetic labels.

BAD: "Vibrant cultural hub with diverse community"
BAD: "Industrial-chic minimalism"

GOOD: "Weekend brunch peak 10am-1pm, strong walk-in 
  culture from waterfront trail users, weekday lunch 
  crowd from nearby office towers"
GOOD: "School pickup window 3-5pm drives weekday foot 
  traffic, Saturday farmers market pulls neighbourhood 
  out, winter slows significantly November through February"

Return exactly 2 behavioural patterns specific enough 
that a business owner on that street would immediately 
recognise them as true.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TASK 5 — CONTACT DISCOVERY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Find the most reliable way to contact this business owner.

Priority order:
1. Direct email from website contact page
2. Instagram handle
3. Facebook business page URL
4. LinkedIn company or owner profile
5. Phone number
6. WhatsApp Business number

Return only what you find. Never invent contact details.

[CONFIDENCE RULES]:
- Researched from real sources: return as-is
- Inferred due to missing data: prefix with "INFERRED: "
- Completely unresolvable: return null
- Never hallucinate business details or contact information

[OUTPUT RULES]:
- Return ONLY raw extracted values — no citation tags
- Strip all <cite>, </cite>, and index attributes before output
- Example: "<cite index=\"1-4\">Doctors and surgeons</cite>" becomes "Doctors and surgeons"
- No <cite> tags, no HTML, no markdown in any field value
- Clean strings only in every field
- JSON format only — no preamble, no explanation
- Start with { and end with }

CRITICAL: If your output contains any <cite> or </cite> tag, 
the JSON is broken. Before returning, scan the entire JSON 
for citation tags. If found, remove them and keep only the text content.

{
  "physical_details": {
    "description": "2-3 sentences — WHO they are, including character/vibe",
    "products_services": {
      "Offering 1": [
        "Signature Practice 1",
        "Signature Practice 2",
        "Signature Practice 3",
        "Signature Practice 4",
        "Signature Practice 5"
       ],
      "Offering 2": [
        "Signature Practice 1",
        "Signature Practice 2",
        "Signature Practice 3",
        "Signature Practice 4",
        "Signature Practice 5"
       ],
      "Offering 3": [
        "Signature Practice 1",
        "Signature Practice 2",
        "Signature Practice 3",
        "Signature Practice 4",
        "Signature Practice 5"
       ],
      "Offering 4": [
        "Signature Practice 1",
        "Signature Practice 2",
        "Signature Practice 3",
        "Signature Practice 4",
        "Signature Practice 5"
       ],
      "Offering 5": [
        "Signature Practice 1",
        "Signature Practice 2",
        "Signature Practice 3",
        "Signature Practice 4",
        "Signature Practice 5"
       ]
     },
    "neighbourhood": "exact neighbourhood name",
    "landmarks": [
      "Named landmark 1",
      "Named landmark 2", 
      "Named landmark 3",
      "Named landmark 4",
      "Named landmark 5"
    ],
    "transit": [
      "Route name and number",
      "Route name and number"
    ],
    "local_trends": [
      "Behavioural pattern 1 — specific and local",
      "Behavioural pattern 2 — seasonal or time-based"
    ],
  },
  "contact": {
    "email": "email or null",
    "instagram": "@handle or null",
    "facebook": "page URL or null",
    "linkedin": "URL or null",
    "phone": "number with country code or null",
    "whatsapp": "number with country code or null",
    "preferred_channel": "most reliable channel found"
  }
}
  `;
}

// ---------------------------------------------------------------------------
// MERGE: Combines vision and research outputs
// Research owns semantic fields. Vision owns visual fields.
// ---------------------------------------------------------------------------

function mergeDiscoveryData(
  visionData: any | null,
  researchData: any | null
): any {
  const phys = researchData?.physical_details || {};
  const vis = visionData?.visuals || researchData?.visuals || {};

  return {
    physical_details: {
      // CITATION STRIPPING applied to all string fields
      description:       stripCitations(phys.description)       || "",
      neighbourhood:     stripCitations(phys.neighbourhood)     || "",
      landmarks:         Array.isArray(phys.landmarks)
        ? phys.landmarks.map((l: string) => stripCitations(l)).filter(Boolean)
        : [],
      transit:           Array.isArray(phys.transit)
        ? phys.transit.map((t: string) => stripCitations(t)).filter(Boolean)
        : [],
      local_trends:      Array.isArray(phys.local_trends)
        ? phys.local_trends.map((t: string) => stripCitations(t)).filter(Boolean)
        : [],
      products_services: phys.products_services || {},
    },
    // NEW SHAPE — color_theme and zones at top level (no more `visuals` bag)
    color_theme: visionData?.color_theme
      ? {
          primary:     stripCitations(visionData.color_theme.primary)     || "neutral",
          secondary:   stripCitations(visionData.color_theme.secondary)   || "neutral",
          accent:      stripCitations(visionData.color_theme.accent)      || "neutral",
          description: stripCitations(visionData.color_theme.description) || "natural tones",
        }
      : null,

    zones: parseZones(visionData?.zones),

    contact: researchData?.contact 
      ? {
          email:            stripCitations(researchData.contact.email),
          instagram:        stripCitations(researchData.contact.instagram),
          facebook:         stripCitations(researchData.contact.facebook),
          linkedin:         stripCitations(researchData.contact.linkedin),
          phone:            stripCitations(researchData.contact.phone),
          whatsapp:         stripCitations(researchData.contact.whatsapp),
          preferred_channel: stripCitations(researchData.contact.preferred_channel),
        }
      : null,
  };
}
// ---------------------------------------------------------------------------
// SAVE: Persists merged discovery data to Supabase
// ---------------------------------------------------------------------------

async function saveDiscoveryData(
  businessId: string,
  businessName: string,
  address: {
    street: string;
    city: string;
    province_state: string;
    country: string;
    postalCode: string;
  },
  merged: any,
  visionSucceeded: boolean
): Promise<void> {
  const phys = merged.physical_details;
  const vis  = merged.visuals;

  // Determine brand source
  const ct   = merged.color_theme;
  const zones = merged.zones;

  const brandSource = (() => {
    if (!visionSucceeded) return "text_search";

    const colorBlind = !ct?.primary
      || typeof ct.primary !== "string"
      || ct.primary.trim().toLowerCase().startsWith("not visible");

    const visibleZones = zones
      ? Object.values(zones).filter((z: any) =>
          z?.layout?.spatial_arrangement
          && !String(z.layout.spatial_arrangement).toLowerCase().startsWith("not visible")
        ).length
      : 0;

    // Color blank AND fewer than 2 visible zones => fall back to research-only
    return (colorBlind && visibleZones < 2) ? "text_search" : "photos";
  })();

  const updatePayload: any = {
    // Semantic fields -- owned by research
    business_description: phys,

    // Contact info -- new field
    contact_info: merged.contact || null,

    // Visual fields -- owned by vision (or research fallback)
    color_theme: merged.color_theme || {
      primary:     "neutral",
      secondary:   "neutral",
      accent:      "neutral",
      description: "natural tones",
    },

    // Zones -- new column
    zones: merged.zones || null,

    // Metadata
    brand_source:               brandSource,
    last_analyzed_business_name: businessName,
    last_analyzed_street:        address.street,
    last_analyzed_city:          address.city,
  };

  const { error: updateError } = await supabase
    .from("businesses")
    .update(updatePayload)
    .eq("id", businessId);

  if (updateError) {
    // Save metadata even if full update fails
    await supabase
      .from("businesses")
      .update({
        last_analyzed_business_name: businessName,
        last_analyzed_street:        address.street,
        last_analyzed_city:          address.city,
      })
      .eq("id", businessId);

    throw updateError;
  }

  console.log(`--- [DISCOVERY] SAVED: ${brandSource} | ${businessName} ---`);
}

// ---------------------------------------------------------------------------
// THE HEAVY RESEARCHER (Orchestrator)
// ---------------------------------------------------------------------------

export async function discoverAndSaveBrandIdentity(
  businessId: string,
  businessName: string,
  address: {
    street: string;
    city: string;
    province_state: string;
    country: string;
    postalCode: string;
  },
  photos: UploadedPhoto[] = [],
  category: string = "",
  niche: string = ""
): Promise<void> {
  console.log(`--- [DISCOVERY] STARTED: ${businessName} ---`);
  console.log(`--- [DISCOVERY] Research provider: ${process.env.DISCOVERY_RESEARCH_PROVIDER || "haiku"} ---`);

  const fullAddressString = `${address.street}, ${address.city},
    ${address.province_state}, ${address.country} ${address.postalCode}`;

  // Run vision and research in parallel
  const [visionResult, researchResult] = await Promise.allSettled([
    photos.length > 0
      ? analyzePhotosWithGemini(photos, businessName, fullAddressString)
      : Promise.resolve(null),
    runResearchProvider(businessName, fullAddressString, category, niche)
  ]);

  const visionData = visionResult.status === "fulfilled"
    ? visionResult.value : null;
  const researchData = researchResult.status === "fulfilled"
    ? researchResult.value : null;

  if (visionResult.status === "rejected") {
    console.warn("[DISCOVERY] Vision path failed:", visionResult.reason);
  }
  if (researchResult.status === "rejected") {
    console.error("[DISCOVERY] Research path failed:", researchResult.reason);
    throw new Error("Research path failed -- cannot continue without business identity.");
  }

  // Merge and save
  const merged = mergeDiscoveryData(visionData, researchData);
  const visionRanAndSucceeded = photos.length > 0 && visionData !== null;
  await saveDiscoveryData(
    businessId, businessName, address, merged, visionRanAndSucceeded
  );

  console.log(`--- [DISCOVERY] COMPLETE: ${businessName} ---`);
}
