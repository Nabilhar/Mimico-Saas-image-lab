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
    const parsed = JSON.parse(raw);
    if (parsed && parsed.neighbourhood) {
      return {
        description:       parsed.description       || "",
        craft_identity:    parsed.craft_identity     || "",
        neighbourhood:     parsed.neighbourhood      || "",
        landmarks:         Array.isArray(parsed.landmarks)         ? parsed.landmarks         : [],
        transit:           Array.isArray(parsed.transit)           ? parsed.transit           : [],
        local_trends:      Array.isArray(parsed.local_trends)      ? parsed.local_trends      : [],
        products_services: Array.isArray(parsed.products_services) ? parsed.products_services : [],
        isJson:            true,
        isInferred:        (parsed.craft_identity || "").startsWith("INFERRED:"),
      };
    }
  } catch (e) {}

  return {
    description:       raw,
    craft_identity:    "",
    neighbourhood:     null,
    landmarks:         [],
    transit:           [],
    local_trends:      [],
    products_services: [],
    isJson:            false,
    isInferred:        false,
  };
}

// ---------------------------------------------------------------------------
// PATH A: Gemini Vision Analysis
// ---------------------------------------------------------------------------

export async function analyzePhotosWithGemini(
  photos: UploadedPhoto[],
  businessName: string,
  fullAddress: string
): Promise<any> {
  console.log(`[Gemini Vision] Analyzing ${photos.length} uploaded photos for ${businessName}...`);

  // Vision only — no search tool
  const model = genAI.getGenerativeModel(
    { model: "models/gemini-2.5-flash" },  // removed tools
    { apiVersion: "v1beta" }
  );
 // FIX: Fetch images from URLs and convert to base64 INTERNALLY
  const imageParts = await Promise.all(
    photos.map(photo => urlToGenerativePart(photo.url, photo.mimeType))
  );

  const photoContext = photos.length > 0
  ? photos.map((p, i) => `Photo ${i + 1}: ${p.label}`).join(", ")
  : "No photos provided";

  const textPrompt = `
  You are a professional brand photographer and visual analyst.
  Your only job is to extract visual identity information 
  from these photos with precision.
  
  [CONTEXT]:
  Business: "${businessName}"
  Address: "${fullAddress}"
  Photos provided: ${photoContext}
  
  [YOUR TASK]:
  Study each photo carefully and extract visual details 
  with the precision of a professional art director.
  
  Do not search the web. Do not infer from business type.
  Read only what is visible in the photos.
  If something is not visible — say "Not visible in photos".
  Never guess. Never invent. Only report what you see.
  
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  COLORS — Read with precision
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Extract colors the way a paint professional would:
  Not "blue" — "deep navy with slight grey undertone"
  Not "brown" — "warm walnut, medium saturation"
  Not "white" — "warm off-white, slightly cream"
  
  For each color identify:
  - The exact hue and tone
  - Whether it is warm, cool, or neutral
  - Its role — dominant, supporting, or accent
  
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  LOGO — If logo photo provided
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  - Primary color of the logo mark or wordmark
  - Secondary color if present
  - Background color
  - Overall palette impression in one phrase
  
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  STOREFRONT — If storefront photo provided
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Facade:
  - Building material (brick, stucco, glass, wood, metal)
  - Facade color — precise tone description
  - Signage color and style
  - Door color and material
  - Window style (floor-to-ceiling, divided panes, frosted)
  - Awning or canopy — color and material if present
  
  Street presence:
  - Corner unit or mid-block
  - Patio or outdoor seating visible
  - Bike racks, planters, or street furniture
  - Overall street-level impression in one sentence
  
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  INTERIOR — If interior photo provided
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Surfaces and materials:
  - Wall color and finish (painted, exposed brick, 
    tile, wood panel, wallpaper)
  - Floor material and color (hardwood tone, tile 
    pattern, concrete, terrazzo)
  - Ceiling — height impression, material, color
  - Counter or bar material if visible 
    (marble, wood, tile, concrete, laminate)
  
  Lighting:
  - Warm or cool light temperature
  - Natural light level — abundant, moderate, dim
  - Pendant lights, track lighting, recessed, 
    neon signs — describe what you see
  - Overall lighting mood in one phrase
  
  Spatial arrangement:
  - Counter or service bar position (front, back, side)
  - Seating style (café chairs, banquettes, bar stools,
    lounge seating) and approximate density
  - Open plan or divided spaces
  - Any distinctive design feature that defines the space
    (exposed pipes, feature wall, open kitchen, etc.)
  
  Mood and atmosphere:
  - One sentence capturing the overall feel of the space
    as a customer would experience it on arrival
  
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  BRAND PALETTE SYNTHESIS
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  After reading all photos:
  - What is the dominant brand color?
  - What is the supporting color?
  - What is the accent or highlight color?
  - Write one sentence describing the overall 
    palette mood — warm/cool, minimal/rich, 
    industrial/organic, bold/restrained
  
  [RULES]:
  - Report only what is visible in the photos
  - Use precise color language — not generic names
  - If a photo type is missing — return 
    "Not visible in photos" for those fields
  - Never infer from business name or category
  - Never search the web
  
  [OUTPUT]:
  Return ONLY a valid JSON object.
  No preamble. No markdown. No explanation.
  Start with { and end with }
  
  {
    "visuals": {
      "primary_color": "precise color description 
        — hue, tone, temperature",
      "secondary_color": "precise color description 
        or Not visible in photos",
      "accent_color": "precise color description 
        or Not visible in photos",
      "theme_description": "one sentence — overall 
        palette mood and atmosphere",
      "logo_colors": "precise colors visible in logo 
        or Not visible in photos",
      "storefront_colors": "facade color, signage color, 
        door color — precise descriptions 
        or Not visible in photos",
      "storefront_architecture": {
        "building": "material, stories, facade style, 
          window type, door — from photo only",
        "features": "patio, corner unit, planters, 
          street furniture — from photo only 
          or Not visible in photos"
      },
      "interior_colors": "wall color, floor tone, 
        ceiling, counter material — precise descriptions 
        or Not visible in photos",
      "interior_layout": "counter position, seating style 
        and density, lighting mood, distinctive features, 
        one sentence atmosphere — from photo only 
        or Not visible in photos"
    }
  }
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
// ---------------------------------------------------------------------------
// RESEARCH PROVIDER ROUTER
// ---------------------------------------------------------------------------

async function runResearchProvider(
  businessName: string,
  fullAddressString: string,
  category: string,
  niche: string
): Promise<any> {

  const provider = process.env.DISCOVERY_RESEARCH_PROVIDER || "haiku";
  console.log(`--- [DISCOVERY] Research provider: ${provider} ---`);

  if (provider === "haiku") {
    return await researchWithHaiku(
      businessName, 
      fullAddressString, 
      category, 
      niche
    );
  }

  if (provider === "gemma") {
    return await researchWithGemma(
      businessName, 
      fullAddressString
    );
  }

  throw new Error(`Unsupported research provider: ${provider}`);
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

  const jsonMatch = textContent.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error(
      `[Haiku Research] No JSON found. Raw: ${textContent.slice(0, 300)}`
    );
  }

  let parsed: any;
  try {
    parsed = JSON.parse(jsonMatch[0]);
  } catch (parseErr) {
    console.error("[Haiku Research] JSON parse failed:", jsonMatch[0].slice(0, 500));
    throw new Error(`[Haiku Research] Invalid JSON: ${(parseErr as Error).message}`);
  }

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

  let parsed: any;
  try {
    parsed = JSON.parse(jsonMatch[0]);
  } catch (parseErr) {
    console.error("[Gemma Research] JSON parse failed:", jsonMatch[0].slice(0, 500));
    throw new Error(`[Gemma Research] Invalid JSON: ${(parseErr as Error).message}`);
  }

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

SEARCH 1 — CRAFT IDENTITY:
Search the official website for owner-written language about how they work.
Focus on: "About", "Menu", "Services", "Our Story", "Our Process" pages.
This is your primary source for craft identity.

SEARCH 2 — LISTINGS & VALIDATION:
Search Google Business profile and Yelp listing together.
Extract: business description, category, hours, contact, highlighted services.
Use these to validate website claims and fill gaps.

SEARCH 3 — PRESS & LOCAL COVERAGE:
Search for: BlogTO, local press, neighbourhood blogs, opening announcements.
These often describe the craft in detail the business doesn't publish themselves.

SEARCH 4 — CONTACT & SOCIAL PRESENCE:
Search Instagram, Facebook, LinkedIn public profiles.
Extract: bio text, contact links, email addresses, handles.
Find the most reliable contact channel.

SEARCH 5 — NEIGHBOURHOOD CONTEXT:
Search Reddit local subreddits and community forums.
Extract: neighbourhood behaviour patterns, seasonal trends, foot traffic timing.
Return exactly 2 specific behavioural patterns the business owner would recognize.
See TASK 4 for quality examples — avoid aesthetic labels, focus on timing and behavior.

[EXTRACTION TASKS]:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TASK 1 — CRAFT IDENTITY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Extract HOW this business works — not just WHAT they sell.

A good craft_identity completes this sentence:
"The quality of what we do lives in ___"

BAD: "They make great pizza using quality ingredients"
GOOD: "72-hour cold fermented dough, 900°F stone-fire, 
  60-second bake window determines crust char and chew"

BAD: "Full-service hair salon with experienced stylists"
GOOD: "Precision cutting built around bone structure 
  analysis before scissors touch the hair — consultation 
  determines the cut, not the other way around"

If no website or press coverage exists:
Infer from category and niche. Be specific to the trade.
Prefix with "INFERRED: " to flag lower confidence.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TASK 2 — OFFERINGS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Extract 5 hero products or services with HOW detail.

BAD: "Signature Men's Haircut"
GOOD: "Signature Men's Haircut — dry cut technique,
  scissor-over-comb finish, structured around 
  natural growth pattern"

Prefix unfindable offerings with "INFERRED: "

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
    "description": "2-3 sentences in owner voice if available",
    "craft_identity": "HOW they work — specific process detail. INFERRED: prefix if no source found.",
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
    "products_services": [
      "Offering 1 — technique or process detail",
      "Offering 2 — technique or process detail",
      "Offering 3 — technique or process detail",
      "Offering 4 — technique or process detail",
      "Offering 5 — technique or process detail"
    ]
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
      craft_identity:    stripCitations(phys.craft_identity)    || "",
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
      products_services: Array.isArray(phys.products_services)
        ? phys.products_services.map((p: string) => stripCitations(p)).filter(Boolean)
        : [],
    },
    visuals: {
      primary_color:     stripCitations(vis.primary_color)      || "neutral",
      secondary_color:   stripCitations(vis.secondary_color)    || "neutral",
      accent_color:      stripCitations(vis.accent_color)       || "neutral",
      theme_description: stripCitations(vis.theme_description)  || "natural tones",
      logo_colors:       stripCitations(vis.logo_colors)        || "Not provided",
      storefront_colors: stripCitations(vis.storefront_colors)  || "Not provided",
      storefront_architecture: vis.storefront_architecture || null,
      interior_colors:   stripCitations(vis.interior_colors)    || "Not provided",
      interior_layout:   stripCitations(vis.interior_layout)    || "Not provided",
    },
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
  userId: string,
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
  const brandSource = (() => {
    if (!visionSucceeded) return "text_search";
    const visualFields = [
      vis.primary_color,
      vis.logo_colors,
      vis.storefront_colors,
      vis.interior_colors,
    ];
    const blindCount = visualFields.filter(
      (f) => !f || typeof f !== "string" || f.trim().toLowerCase().startsWith("not visible")
    ).length;
    return blindCount >= 2 ? "text_search" : "photos";
  })();

  const updatePayload: any = {
    // Semantic fields — owned by research
    business_description: phys,

    // Contact info — new field
    contact_info: merged.contact || null,

    // Visual fields — owned by vision (or research fallback)
    color_theme: {
      primary:     vis.primary_color     || "neutral",
      secondary:   vis.secondary_color   || "neutral",
      accent:      vis.accent_color      || "neutral",
      description: vis.theme_description || "natural tones",
    },
    business_visuals: {
      logoColors:       vis.logo_colors        || "Not provided",
      storefrontColors: vis.storefront_colors  || "Not provided",
      interiorColors:   vis.interior_colors    || "Not provided",
    },
    storefront_architecture: vis.storefront_architecture || null,
    interior_layout:         vis.interior_layout         || "Not provided",

    // Metadata
    brand_source:               brandSource,
    last_analyzed_business_name: businessName,
    last_analyzed_street:        address.street,
    last_analyzed_city:          address.city,
  };

  const { error: updateError } = await supabase
    .from("profiles")
    .update(updatePayload)
    .eq("id", userId);

  if (updateError) {
    // Save metadata even if full update fails
    await supabase
      .from("profiles")
      .update({
        last_analyzed_business_name: businessName,
        last_analyzed_street:        address.street,
        last_analyzed_city:          address.city,
      })
      .eq("id", userId);

    throw updateError;
  }

  console.log(`--- [DISCOVERY] SAVED: ${brandSource} | ${businessName} ---`);
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
    throw new Error("Research path failed — cannot continue without craft identity.");
  }

  // Merge and save
  const merged = mergeDiscoveryData(visionData, researchData);
  const visionRanAndSucceeded = photos.length > 0 && visionData !== null;
  await saveDiscoveryData(
    userId, businessName, address, merged, visionRanAndSucceeded
  );

  console.log(`--- [DISCOVERY] COMPLETE: ${businessName} ---`);
}