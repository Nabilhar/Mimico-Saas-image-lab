// generate/route

import { 
  GoogleGenerativeAI, 
  HarmCategory, 
  HarmBlockThreshold 
} from "@google/generative-ai";
import { NextResponse } from "next/server";
import Groq from "groq-sdk"; // <-- NEW
import { createClient } from '@supabase/supabase-js';
import { getFramework, Framework, FRAMEWORKS   } from "@/lib/frameworks";
import { TIP_MODE, CTA_BY_POST_TYPE, SEASONAL_NICHE_NARRATIVE, getSeason, NARRATIVE_COMBINATIONS, NarrativeEntry, ANGLE_POOL} from "@/lib/frameworks";
import { getBrandIdentity, discoverAndSaveBrandIdentity, parseBusinessIntel} from "@/lib/brandDiscovery";
import { parseInteriorLayout, parseExteriorLayout, parseZones } from '@/lib/parse-business-intel';
import { ColorTheme, BusinessVisuals } from '@/lib/constants';
import { auth } from "@clerk/nextjs/server"; 
import { selectAngle } from "@/lib/angle-selector";
import { buildPrompt as buildModePrompt } from "@/lib/prompt-builder";  // ← NEW
import { CognitiveLens } from "@/lib/cognitive-lenses";
import { VOICE_PROMPTS } from "@/lib/VOICE_PROMPTS";
import { getBusinessTime, getTimezoneForCity } from "@/lib/timezone";
import { selectCategory } from '@/lib/category-selector';
import { 
  getRecentPostHistory, 
  getRecentOfferings, 
  formatRecentSummaries 
} from '@/lib/post-history';
import { parseGeneratedPost, validateOfferings } from '@/lib/post-parser';
import type { PostType } from '@/lib/mode-templates';

interface AIProviderResponse {
  content: string;
  tokensUsed: number;
  provider: string;
}

// 1. Initialize Groq (The New Engine)
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// NEW: Initialize DeepInfra client (using Groq SDK's OpenAI-compatible interface)
const deepinfraClient = new Groq({
  apiKey: process.env.DEEPINFRA_API_KEY,
  baseURL: "https://api.deepinfra.com/v1/openai", // DeepInfra's OpenAI-compatible endpoint
});

// NEW: Initialize OpenRouter client (using Groq SDK's OpenAI-compatible interface)
const openrouterClient = new Groq({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1", // OpenRouter's OpenAI-compatible endpoint
});

// 2. Initialize Gemini (The Original Engine)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Use the SECRET key, not the ANON key
);

// ─────────────────────────────────────────────
// WEATHER FETCHER
// ─────────────────────────────────────────────
const WMO_CODES: Record<number, string> = {
  0: "clear skies",
  1: "mostly clear", 2: "partly cloudy", 3: "overcast",
  45: "foggy", 48: "icy fog",
  51: "light drizzle", 53: "drizzle", 55: "heavy drizzle",
  61: "light rain", 63: "rain", 65: "heavy rain",
  71: "light snow", 73: "snow", 75: "heavy snow", 77: "snow grains",
  80: "rain showers", 81: "heavy rain showers", 82: "violent rain showers",
  85: "snow showers", 86: "heavy snow showers",
  95: "thunderstorm", 96: "thunderstorm with hail", 99: "thunderstorm with heavy hail",
};

async function fetchWeather(lat: number, lng: number, city: string): Promise<string> {
  try {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,apparent_temperature,weather_code&temperature_unit=celsius`
    );
    const data = await res.json();
    const current = data.current;
    const description = WMO_CODES[current.weather_code] ?? "variable conditions";
    const temp = Math.round(current.temperature_2m);
    const feelsLike = Math.round(current.apparent_temperature);
    
    // Only show "feels like" if it's different
    const feelsLikeText = temp !== feelsLike ? `, feels like ${feelsLike}°C` : '';
    
    return `${temp}°C${feelsLikeText}, ${description} in ${city}`;
  } catch {
    return "";
  }
}

// ─────────────────────────────────────────────
// 3. VOICE DEFINITIONS
// Matches the exact voice strings sent from the frontend.
// ─────────────────────────────────────────────



// ─────────────────────────────────────────────────────────────────────────────
// HELPER: THE PROVIDER CALLER
// This encapsulates the actual API calls so the router can call them in a loop
// ─────────────────────────────────────────────────────────────────────────────
async function callAIProvider(provider: string, finalPrompt: string, currentTime: string, address: any

) : Promise<AIProviderResponse> {
  const fullAddress = `${address.city}, ${address.province_state} ${address.country} ${address.postal_code}`;

  if (provider === "groq") {

        // ──────────────────────────────────────────────────────────────
        console.log("\n\n🚀 === [FULL GROQ PROMPT START] === \n");
        console.log(finalPrompt);
        console.log("\n === [FULL GROQ PROMPT END] === \n\n");
        // ──────────────────────────────────────────────────────────────

        console.log(`--- PROMPT LENGTH: ${finalPrompt.length} characters, ~${Math.round(finalPrompt.length / 4)} tokens ---`);
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: `Output only what is requested. No preamble.` },
        { role: "user", content: finalPrompt }
      ],
      model: "openai/gpt-oss-120b",
      temperature: 0.9,
      max_tokens: 3000,
    });
    const groqContent = chatCompletion.choices[0]?.message?.content;
    const tokensUsed = chatCompletion.usage?.total_tokens ?? 0;
    console.log("--- GROQ FINISH REASON:", chatCompletion.choices[0]?.finish_reason);
    console.log(`--- GROQ TOKENS: ${tokensUsed} ---`);
    return { content: groqContent || "", tokensUsed, provider: "groq" };
  }

    // ───────────────────────────────────────────────────────────────────────────
  // NEW CLAUDE PROVIDER
  // ───────────────────────────────────────────────────────────────────────────

  if (provider === "anthropic") {

    // ──────────────────────────────────────────────────────────────
    console.log("\n\n🚀 === [FULL HAIKU PROMPT START] === \n");
    console.log(finalPrompt);
    console.log("\n === [FULL HAIKU PROMPT END] === \n\n");
    // ──────────────────────────────────────────────────────────────

    console.log(`--- PROMPT LENGTH: ${finalPrompt.length} characters, ~${Math.round(finalPrompt.length / 4)} tokens ---`);

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 3000,
        messages: [
          { role: "user", content: finalPrompt }
        ],
        system: "Output only what is requested. No preamble.",
      }),
    });
  
    const raw = await response.text();
    const data = JSON.parse(raw);
    if (data.error) throw new Error(`Anthropic error: ${data.error.message}`);
    
    const content = data.content[0]?.text;
    const tokensUsed = (data.usage?.input_tokens ?? 0) + (data.usage?.output_tokens ?? 0);
    console.log("--- ANTHROPIC FINISH REASON:", data.stop_reason);
    console.log(`--- ANTHROPIC TOKENS: ${tokensUsed} (in: ${data.usage?.input_tokens}, out: ${data.usage?.output_tokens}) ---`);
    return { content: content || "", tokensUsed, provider: "anthropic" };
  }

    // ───────────────────────────────────────────────────────────────────────────
  // NEW DEEPINFRA PROVIDER
  // ───────────────────────────────────────────────────────────────────────────
  if (provider === "deepinfra") {
    console.log(`--- Shoreline ENGINE: ROUTING TO DEEPINFRA (gpt-oss-120b) ---`);
    
    const response = await fetch("https://api.deepinfra.com/v1/openai/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.DEEPINFRA_API_KEY}`,
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b",
        messages: [
          { role: "system", content: "Output only what is requested. No preamble." },
          { role: "user", content: finalPrompt }
        ],
        temperature: 0.9,
        max_tokens: 3000,
      }),
    });
  
    const data = await response.json();
    console.log("--- DEEPINFRA FINISH REASON:", data.choices[0]?.finish_reason);
    const content = data.choices[0]?.message?.content;
    console.log("--- DEEPINFRA CONTENT:", content);
    return content || "";
  }


  // ───────────────────────────────────────────────────────────────────────────
  // NEW OPENROUTER PROVIDER
  // ───────────────────────────────────────────────────────────────────────────
  if (provider === "openrouter") {
    console.log(`--- Shoreline ENGINE: ROUTING TO OPENROUTER ---`);
    console.log(`--- PROMPT LENGTH: ${finalPrompt.length} characters, ~${Math.round(finalPrompt.length / 4)} tokens ---`);
  
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "HTTP-Referer": "https://shorlinestudio.ca", // OpenRouter requires this
        "X-Title": "Shoreline",                   // Optional but recommended
      },
      body: JSON.stringify({
        model: "anthropic/claude-haiku-4.5",
        messages: [
          { role: "system", content: "Output only what is requested. No preamble." },
          { role: "user", content: finalPrompt }
        ],
        temperature: 0.9,
        max_tokens: 5000,
      }),
    });

      // ADD THESE TWO LINES BEFORE PARSING
      const raw = await response.text();
      console.log("--- OPENROUTER RAW RESPONSE:", raw);

      const data = JSON.parse(raw);  // ✅ parse from the text we already read

      if (data.error) {
        console.error("--- OPENROUTER API ERROR:", data.error.message);
        throw new Error(`OpenRouter error: ${data.error.message}`);
      }

      const reasoningTokens = data.usage?.completion_tokens_details?.reasoning_tokens;
      console.log(`--- OPENROUTER REASONING TOKENS: ${reasoningTokens} ---`);
      const content = data.choices[0]?.message?.content;
      console.log("--- OPENROUTER FINISH REASON:", data.choices[0]?.finish_reason);
      console.log("--- OPENROUTER CONTENT:", content);
      return content || "";
      }
  
  if (provider === "gemma") {
    console.log("--- Shoreline ENGINE: ROUTING TO GEMMA 4 (26B MoE) ---");
    const tools = [{ googleSearch: {} }] as any;
    const model = genAI.getGenerativeModel({ 
      model: "models/gemma-4-31b-it",
      tools: tools 
    }, { apiVersion: 'v1beta' });

    const result = await model.generateContent({
      contents: [{ 
        role: "user", 
        parts: [{ text: `Before writing, silently research current local news, events, and weather for ${fullAddress} at ${currentTime}. Use those findings naturally in the post. Then write: \n\n ${finalPrompt}` }] 
      }],
      generationConfig: {
        temperature: 1.0,
        maxOutputTokens: 6000,
      } as any,
    });
    const content = result.response.text();
    const tokensUsed = result.response.usageMetadata?.totalTokenCount ?? 0;
    console.log(`--- GEMMA TOKENS: ${tokensUsed} ---`);
    return { content, tokensUsed, provider: "gemma" };
  } 
  
  if (provider === "gemini") {
    console.log("--- Shoreline ENGINE: ROUTING TO GOOGLE GEMINI ---");
    const model = genAI.getGenerativeModel({   model: "models/gemini-2.5-flash",
      tools: [{ googleSearch: {} }] as any,
    }, { apiVersion: 'v1beta' });
    
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: finalPrompt }] }],
      generationConfig: { temperature: 0.8, maxOutputTokens: 8000 },
      // ... safety settings
    });

    const content = result.response.text();
    const tokensUsed = result.response.usageMetadata?.totalTokenCount ?? 0;
    console.log(`--- GEMINI TOKENS: ${tokensUsed} ---`);
    
    return { content, tokensUsed, provider: "gemini" };
  }
  
  throw new Error(`Unsupported provider: ${provider}`);
}

// ─────────────────────────────────────────────
// 4. PROMPT BUILDER
// Owner-perspective persona + <research> tags + seasonality
// + keyword-first caption + framework all assembled here.
// ─────────────────────────────────────────────

function buildLegacyPrompt(
  business_name: string,
  category: string,
  niche: string,
  address: any,
  voice: string,
  postType: string,
  framework: string,
  month: string,
  recentHistory: string | null, 
  promoType: string,
  eventType: string,
  customDetails: string,
  colorTheme: ColorTheme | null,
  businessVisuals: BusinessVisuals | null,
  business_description: string | null,
  varietyRules: string,
  currentWeather: string,
  recentLenses: string[]

): { prompt: string; }  {


  const fullAddress = `${address.street}, ${address.city}, ${address.province_state} ${address.country} ${address.postal_code}`;

  const narrativeKey = `${framework}_${postType}`;
  const rawNarrative = NARRATIVE_COMBINATIONS[narrativeKey] as NarrativeEntry;
  const narrative = typeof rawNarrative === "function"
    ? rawNarrative(
        postType === "Promotion / offer" ? promoType : eventType,
        customDetails,
        fullAddress
      )
    : (rawNarrative ?? "Follow the framework structure. Be locally specific.");

    const tipMode = TIP_MODE[niche] || TIP_MODE[category] || "service";

    const tipModeInstruction = postType === "Tip of the Day"
      ? (tipMode === "neighbourhood"
          ? `Tips: practical local life-admin a community expert would share.
          1 tip max may reference the core service.
          Only use landmarks in [LOCAL_GROUND_TRUTH] Nearby. Never invent places, routes, or institutions.
          BAD: "parking near our office" / "explore local shops" / "support local events"
          GOOD: specific, actionable, locally-grounded knowledge the reader couldn't Google.`
          : `Tips: Share real craft knowledge freely — the kind any expert would teach a curious friend.
          Any aspect of the craft is fair game: technique, ingredients, what separates good from great.
          The only rule: no tip sells or promotes this business.
          No treatment names, service names, or product lines this business offers.
          No "come visit us", no "ask about our specials", no soft sells of any kind.
          HARD CHECK before writing each tip: Could this tip appear on any expert's blog
          without mentioning this business? If no — rewrite it until yes.
          Local grounding belongs in the opener and close only — not the tips.`)
      : "";

  // Select a random angle from the pool for this category + post type
  const anglePool = ANGLE_POOL[category]?.[postType] || [];
  const selectedAngleText = anglePool.length > 0
    ? anglePool[Math.floor(Math.random() * anglePool.length)]
    : null;


  const currentTime = new Date().toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit', 
    hour12: true 
  });

  // STEP 2: Get business intelligence
  const intel = parseBusinessIntel(business_description);

  // Angle selection — dynamic for most post types, null for Promotion
  const selectedAngle = postType === "Promotion / offer" ? null : true;

  const localFacts = intel?.isJson ? `
  [LOCAL_GROUND_TRUTH]:
  This is background knowledge — not a checklist.
  Use only what earns its place.
  
  Neighbourhood: ${intel.neighbourhood}
  Nearby: ${intel.landmarks.join(", ")}
  Transit: ${intel.transit.join(", ")}
  Vibe: ${intel.local_trends.join(", ")}
  Offerings: ${intel.products_services.join(", ")}
  ${intel.isInferred 
    ? "Note: Craft identity was inferred — use as background context only." 
    : ""}
  ` : `[RESEARCH]: Search for "${business_name}" in ${fullAddress}.`;

  const coreIntel =  `[BUSINESS_SUMMARY]: ${intel?.description || "A local " + niche + " serving the community."}`;


// Handle the "New User" scenario: If no colors exist, tell the AI to derive them from research.
  const visualIdentity = `
  [VISUALS]:
  Palette: ${colorTheme?.primary || "Auto-detect"}, ${colorTheme?.secondary || "Auto-detect"}, ${colorTheme?.accent || "Auto-detect"}
  Mood: ${colorTheme?.description || "Derive from research/niche"}
  Details: Logo(${businessVisuals?.logoColors || "N/A"}), Store(${businessVisuals?.storefrontColors || "N/A"}), Interior(${businessVisuals?.interiorColors || "N/A"})
  RULE: Let the Palette, Mood and Details shape your word choices — warm earthy tones call for grounded tactile language; clean minimal tones call for precise spare language. Do not describe the colors directly. If "Auto-detect" is listed, use your research findings to determine the brand's visual vibe and match your language to it.`;


    // --- SAFE ACCESS / FALLBACK LOGIC ---
    // This prevents the "Type null is not assignable to string" error
    // and prevents the AI from seeing "[object Object]"
    const colorDesc = colorTheme?.description || "natural, authentic tones";
    const primaryCol = colorTheme?.primary || "neutral";
    const secondaryCol = colorTheme?.secondary || "neutral";
    const accentCol = colorTheme?.accent || "neutral";

    const logoCol = businessVisuals?.logoColors || "Not provided";
    const storefrontCol = businessVisuals?.storefrontColors || "Not provided";
    const interiorCol = businessVisuals?.interiorColors || "Not provided";

    const capitalizedMonth = month.charAt(0).toUpperCase() + month.slice(1);
    const season = getSeason(capitalizedMonth); 
    const seasonalNicheGuidance = SEASONAL_NICHE_NARRATIVE[season]?.[category] || "";

    const FRAMEWORK_SHAPES = {
      PAS: ["HOOK", "AGITATE", "SOLVE"],
      BAB: ["BEFORE", "AFTER", "BRIDGE"],
      AIDA: ["ATTENTION", "INTEREST", "DESIRE", "ACTION"]
    } as const satisfies Record<Framework, readonly string[]>;

    const shape = FRAMEWORK_SHAPES[framework as keyof typeof FRAMEWORK_SHAPES];

    const rendered = shape
      .map((stage: string) => {
        const options =
          (FRAMEWORKS as any)?.[framework]?.[stage] ?? [];
    
        return options[0] ?? "";
      })
      .join("\n\n");
  

    const roleInstruction = postType === "Community moment"
      ? `You are the owner of "${business_name}", a ${niche} at ${fullAddress}.
          Write in your own voice — observational, not educational.
          You notice what happens in the room. You see the scene — you don't explain it or sell it.
          Describe what people do and feel. The business is the backdrop that makes the moment possible.`
      : `You are the owner of "${business_name}", a ${niche} at ${fullAddress}.
          Write like someone in the middle of a real shift — noticing things, remembering moments, reacting to what happened in the room.
          The tone is observational, grounded, and human.
          You are not teaching, selling, or explaining processes step-by-step.
          Do not sound like a textbook, consultant, food scientist, or advertisement.`;

    const promptText = `

      [ROLE]: ${roleInstruction}

      Your job is to express causal truth inside a real operational system.

      You are NOT allowed to:
      - explain frameworks or lenses
      - generalize abstractly
      - invent new tools, equipment, or systems
      - describe customer emotions or interpretations
      - use reflective intros (e.g. "I used to think", "I've learned")

      You ARE required to:
      - anchor everything in physical process or constraint
      - express cause → effect relationships
      - stay inside existing business facts only

      [BUSINESS_SYSTEM]:

      ${coreIntel}

      ${intel?.products_services?.length ? `Offerings: ${intel.products_services.join(", ")}` : ''}

      [LOCAL_CONTEXT]:
      ${intel?.neighbourhood ? `Neighbourhood: ${intel.neighbourhood}` : ''}
      ${intel?.landmarks?.length ? `Nearby: ${intel.landmarks.join(", ")}` : ''}
      ${intel?.local_trends?.length ? `Vibe: ${intel.local_trends.join(", ")}` : ''}


      [SEASONAL_CONTEXT]: ${season} | ${currentTime} | ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} | ${currentWeather }

      These are facts. Do not embellish. Do not extend them.


      [CATEGORY CONTEXT]:
     

      [COGNITIVE LENS]: 
      

      [TASK]:
      Open with one specific craft truth through the lens. Do not explain the lens.
      Do not describe the system abstractly. Start inside a real moment where this lens is already happening.
      
      [EXPRESSION HINT]:
      Express this through something concrete:
      - a constraint
      - a tradeoff
      - a threshold
      - or a correction

      Do not force it. Use what fits the moment.

      [VOICE]: ${VOICE_PROMPTS[voice]}

      [POST TYPE]: ${postType}

      [FRAMEWORK]: ${framework}
      ${rendered}

      [CTA]: 
      ${CTA_BY_POST_TYPE[postType]}

      [HARD CONSTRAINTS]:
      - words. 1st person. Short paragraphs, double-spaced.
      - Max 3 emojis in body only. Never in hashtags.
      - No labels (e.g. "Hook:", "Tip 1:"). No commentary or word counts.
      - No competing business references.
      - Do not introduce new tools, equipment, or systems unless explicitly present in [BUSINESS_SUMMARY].
        You may only describe adjustments to existing systems.

      [BANNED PHRASES]:
      "bike-to-work buzz" / "stone's throw" / "pour our hearts" / "passionate about" /
      "quality service" / "reach out" / "don't hesitate" / "pride ourselves" /
      "Are you tired of" / "Don't miss out" / "Limited time offer" /
      "we're here to help" / "feel free to"

      [BANNED OPENERS]:
      - No opener about the owner instead of the subject
      - Do not echo: ${recentHistory || "None"}

      [VARIETY RULES]:
      ${varietyRules}

      IMPORTANT: The lens selected for THIS post is: 
      This lens must NOT appear in the "recently used" list above.
      If you see it there, STOP and report an error.

      [OUTPUT]: <<<POST_BEGIN>>> then post body then hashtags. Nothing else.

`;
  return { prompt: promptText, };
}

// Helper function to extract recently used lenses from post history
function extractRecentLenses(postHistory: any[]): string[] {
  if (!postHistory || postHistory.length === 0) return [];
  
  return postHistory
    .slice(0, 3)  // Last 3 posts
    .map(p => p.cognitive_lens)  // Extract the lens field
    .filter(Boolean);  // Remove any undefined/null values
}

// ─────────────────────────────────────────────
// 5. API ROUTE HANDLER
// ─────────────────────────────────────────────

export async function POST(req: Request) {

  const { userId } = await auth(); // Get the authenticated user's ID from Clerk
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return NextResponse.json({ error: "Missing API Key" }, { status: 500 });
  }

  try {
    const body = await req.json();
    const {
      business_name,
      category,
      niche,
      voice,
      postType = "Tip of the Day", 
      eventType = "event",
      eventOrShoutout = "",
      history: postHistory,
      provider: requestedProvider,
      address,  // ✨ NEW: Accept address object from GenerateDashboard
      offerName = "",
      whatsIncluded = "",
      availableTimeframe = "",
      eligibility = "anyone",
      offerHook = "",
      valueFraming = "discount"
    } = body;

      // --- ADD THIS DEBUG BLOCK ---
      console.log("--- Shoreline MEMORY CHECK ---");
      if ( postHistory && postHistory.length > 0) {
        console.log(`Found ${postHistory.length} previous posts.`);
        postHistory.slice(0, 3).forEach((p: any, i: number) => {
          const firstSentence = (p.content || "").split(/[.!?]/)[0].trim();
          console.log(`Post ${i + 1} opening: "${firstSentence}"`);
        });

      } else {
        console.log("NO HISTORY FOUND. Generating from scratch.");
      }
      console.log("-----------------------");


    // ═══════════════════════════════════════════════════════════════════════════
    // ✨ NEW: Handle address from request (from GenerateDashboard)
    // ═══════════════════════════════════════════════════════════════════════════
    let fullAddress: string;

    if (address && address.street && address.city) {
      // Use address from request if provided
      fullAddress = `${address.street}, ${address.city}, ${address.province_state} ${address.country} ${address.postal_code}`;
      console.log("✅ Using address from request:", fullAddress);
    } else {
      // Fallback: Will be built after Supabase fetch
      console.log("⏳ Will use address from Supabase after fetch");
      fullAddress = ""; // Placeholder
    }
    // ═══════════════════════════════════════════════════════════════════════════
    
    const { data: business, error: businessError  } = await supabase
    .from('businesses')
    .select(' id, business_name, street, city, province_state, country, postal_code, business_description, color_theme, business_visuals,storefront_architecture, interior_layout, zones, timezone')
    .eq('user_id', userId)
    .eq('is_active', true)
    .single();

    if (businessError  || !business) {
      return NextResponse.json({ error: "Business profile not found. Please complete your profile." }, { status: 404 });
    }

    // ✨ NEW: Fallback - build fullAddress from Supabase if not in request
    if (!fullAddress || fullAddress === "") {
      fullAddress = `${business.street}, ${business.city}, ${business.province_state} ${business.country} ${business.postal_code}`;
      console.log("✅ Built fullAddress from Supabase:", fullAddress);
    }

    // Step 2: Parse business intelligence (you already do this above)
    const intel = parseBusinessIntel(business.business_description);

    if (intel) {
      intel.zones = business.zones || null;
    }

    const recentHistory = postHistory?.length
    ? postHistory
        .slice(0, 3)
        .map((p: any, i: number) => {
          const content = p.content || "";
          
          // Extract opening pattern (truncated)
          const firstSentence = content.split(/[.!?]/)[0].trim();
          const openingPattern = firstSentence.slice(0, 40);
  
          // Extract product/offering mentions
          const offerings = intel?.products_services || [];
          const mentionedOfferings = offerings.filter((offering: string) =>
            content.toLowerCase().includes(offering.toLowerCase())
          );
  
          // Extract landmark mentions
          const landmarks = intel?.landmarks || [];
          const mentionedLandmarks = landmarks.filter((landmark: string) =>
            content.toLowerCase().includes(landmark.toLowerCase())
          );
  
          return [
            `Post ${i + 1}:`,
            `  - Opening pattern: "${openingPattern}..."`,
            mentionedOfferings.length
              ? `  - Products used: ${mentionedOfferings.join(", ")}`
              : null,
            mentionedLandmarks.length
                ? `  - Landmarks used: ${mentionedLandmarks.join(", ")}`
                : null,
          ]
            .filter(Boolean)
            .join("\n");
        })
        .join("\n\n")
    : "No previous posts found.";

    // Extract lenses from recent posts for variety
    const recentLenses = postHistory?.length 
    ? extractRecentLenses(postHistory)
    : [];

    console.log("--- LENS HISTORY CHECK ---");
    console.log("Recent lenses used:", recentLenses);
    console.log("--------------------------");
    
        // Variety rules — products and landmarks used recently
    const usedOfferings = postHistory?.slice(0, 3).flatMap((p: any) => {
      const offerings = intel?.products_services || [];
      return offerings.filter((o: string) =>
        (p.content || "").toLowerCase().includes(o.toLowerCase())
      );
    }) || [];

    const usedLandmarks = postHistory?.slice(0, 3).flatMap((p: any) => {
      const landmarks = intel?.landmarks || [];
      return landmarks.filter((l: string) =>
        (p.content || "").toLowerCase().includes(l.toLowerCase())
      );
    }) || [];


    const uniqueUsedLandmarks = [...new Set(usedLandmarks)] as string[];

    // NEW — offerings from structured column, not substring matching
const recentOfferings = await getRecentOfferings(supabase, userId);

    const varietyRules = [
      recentOfferings.length
      ? `- Products/offerings recently covered: ${recentOfferings.join(", ")}`
      : "- No recent product patterns to avoid.",
      // Landmarks still string-matched for now — fine until we add landmarks_referenced
      uniqueUsedLandmarks.length
      ? `- Landmarks recently mentioned: ${uniqueUsedLandmarks.join(", ")}`
      : "- No recent landmark patterns to avoid.",
      recentLenses.length
        ? `  - Cognitive lenses recently used: ${recentLenses.join(", ")} — select a completely different lens.`
        : "  - No recent lens patterns to avoid."
    ].join("\n");

    // Auto-select framework — user never has to choose
    const framework: Framework = getFramework(category, postType, voice) || "PAS";
    console.log("Using Framework:", framework);

    // Inject current month for seasonality
    const month = new Date().toLocaleString("en", { month: "long" });

    // Fetch weather for the business location
    let currentWeather = "";
    try {
      const geoRes = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(business.city)}&count=1&language=en&format=json`
      );
      const geoData = await geoRes.json();
      const loc = geoData.results?.[0];
      if (loc) {
        currentWeather = await fetchWeather(loc.latitude, loc.longitude, business.city);
        console.log(`--- WEATHER: ${currentWeather} ---`);
      }
    } catch {
      console.warn("Weather fetch failed — continuing without it.");
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // NEW SYSTEM: 7-group lens + MODE templates
    // ═══════════════════════════════════════════════════════════════════════════

    // Step 1: Get lens from all 4 available lenses (history prevents repetition)
    const angle = selectAngle(recentLenses as CognitiveLens[]);

    // NEW — fetch mode-specific history directly from Supabase
    const { categories: recentCategories, summaries: recentSummaries } = 
    await getRecentPostHistory(supabase, userId, postType as PostType);

    const selectedCategory = selectCategory(postType as PostType, recentCategories);
    const recentSummariesFormatted = formatRecentSummaries(recentSummaries);

    console.log(`[generate] post_type: ${postType}`);
    console.log(`[generate] recent categories: ${JSON.stringify(recentCategories)}`);
    console.log(`[generate] selected category: ${selectedCategory}`);
    console.log(`[generate] recent summaries count: ${recentSummaries.length}`);

    // Step 3: Build parsed business intel structure
    const businessIntel = intel?.isJson ? {
      neighbourhood: intel.neighbourhood,
      landmarks: intel.landmarks || [],
      transit: intel.transit || [],
      local_trends: intel.local_trends || [],
      products_services: intel.products_services || [],
      practices_by_offering: intel.practices_by_offering || {}, 
      description: intel.description,
      interior_layout: parseInteriorLayout(business.interior_layout),
      storefront_architecture: parseExteriorLayout(business.storefront_architecture),
      zones: parseZones(business.zones),
      isInferred: intel.isInferred,
    } : undefined;

    // Step 4: Get current date/time/season (TIMEZONE-AWARE)
    const businessTime = getBusinessTime(business.timezone || "America/Toronto");
    
    const currentTime = businessTime.time;      // "4:30 PM" in business timezone
    const currentDay = businessTime.day;        // "Wednesday"
    const currentDate = businessTime.date;      // "Wednesday, May 14, 2026"
    const currentSeason = getSeason(month);

    // Step 5: Build complete prompt using MODE template
    const finalPrompt = buildModePrompt({
      business_name: business.business_name,
      niche,
      fullAddress: `${business.street}, ${business.city}, ${business.province_state} ${business.country} ${business.postal_code}`,
      lens: angle.lens,
      lensDefinition: angle.lensDefinition,
      groupContext: "",
      voice,
      postType: postType as PostType,
      recentHistory: recentHistory || undefined,
      category: selectedCategory,
      recentSummariesFormatted,
      varietyRules,
      currentTime,
      currentDay,
      currentDate,
      currentWeather: currentWeather || "Unknown",
      currentSeason,
      businessIntel: businessIntel,  // NEW: Pass structured data
      event_type: eventType,
      event_or_shoutout: eventOrShoutout,
      // ✨ NEW: Promotion/Offer specific variables (MODE 4)
      offer_name: offerName,
      whats_included: whatsIncluded,
      available_timeframe: availableTimeframe,
      eligibility,
      offer_hook: offerHook,
      value_framing: valueFraming,
    });

    // Extract lens for later use
    const lens = angle.lens;

    // ═══════════════════════════════════════════════════════════════════════════
    // ── MOCK MODE (delete before going to production) ─────
    if (process.env.NEXT_PUBLIC_MOCK_AI === "true") {
      await new Promise((resolve) => setTimeout(resolve, 800));
      return NextResponse.json({
        content: `<research>TEST MODE: ${business.city} | Framework: ${framework} | Month: ${month}</research>\n\nThis is a mock post for ${business_name} in ${business.city}. Framework auto-selected: ${framework}. No API tokens used.`,
        framework,
      });
    }
    // ─────────────────────────────────────────────────────

  
    // ─────────────────────────────────────────────────────────────────────────────
    // THE SMART ROUTER LOGIC
    // ─────────────────────────────────────────────────────────────────────────────
    const engineMode = process.env.AI_ENGINE_MODE || "FALLBACK"; 

    let rawResponse = "";
    let tokensUsed = 0;
    let providerUsed = "";
    
    if (engineMode === "TOGGLE") {
      const providerToUse = requestedProvider || process.env.AI_PROVIDER || "gemini";
      console.log(`--- Shoreline MODE: TOGGLE [Using ${providerToUse}] ---`);
      const result = await callAIProvider(providerToUse, finalPrompt, currentTime, business);
      rawResponse = result.content;
      tokensUsed = result.tokensUsed;
      providerUsed = result.provider;
      console.log("--- RAW RESPONSE ---");
      console.log(rawResponse);
      console.log("--- END RAW RESPONSE ---");
    } else {
      console.log("--- Shoreline MODE: FALLBACK CHAIN ---");
      const fallbackChain = ["anthropic", "openrouter", "deepinfra"];
      let success = false;
    
      for (const provider of fallbackChain) {
        try {
          const result = await callAIProvider(provider, finalPrompt, currentTime, business);
          if (result.content) {
            rawResponse = result.content;
            tokensUsed = result.tokensUsed;
            providerUsed = result.provider;
            success = true;
            console.log(`--- FALLBACK SUCCESS: ${providerUsed} (${tokensUsed} tokens) ---`);
            break;
          }
        } catch (e: any) {
          console.warn(`Provider ${provider} failed: ${e.message}. Moving to next in chain...`);
        }
      }

      if (!success) throw new Error("All AI providers failed to generate content.");
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // RESPONSE VALIDATION
    // ─────────────────────────────────────────────────────────────────────────────
    if (!rawResponse || rawResponse.trim().length < 100) {
      console.error("--- RESPONSE TOO SHORT OR EMPTY — ABORTING ---");
      console.error(`Raw response length: ${rawResponse?.length ?? 0} characters`);
      return NextResponse.json(
        { error: "Generation failed — response was empty or too short. No credits were used for this request. Please try again." },
        { status: 500 }
      );
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // LOGGING & CLEANUP
    // ─────────────────────────────────────────────────────────────────────────────
    const cleanedResponse = rawResponse

    .replace(/<research>[\s\S]*?<\/research>/gi, "")
    .replace(/--- RAW RESPONSE ---[\s\S]*?--- END STRIPPED ---/gi, "")
    .replace(/\*Check.*?\*/gi, "")
    .replace(/Total words:\s*\d+/gi, "")
    .trim();
  
  // ── NEW: Parse the cleaned text into structured fields ───────────────
  const parsed = parseGeneratedPost(cleanedResponse, postType as PostType);
  
  // ── NEW: Validate offerings, compute analytics ───────────────────────
  const knownOfferings = intel?.products_services || [];
  const validatedOfferings = validateOfferings(
    parsed.offerings_referenced, 
    knownOfferings
  );
  
  const wordCount = parsed.content.split(/\s+/).filter(Boolean).length;
  
  console.log('[generate] parsed output:', {
    has_category: !!parsed.content_category,
    has_summary: !!parsed.content_summary,
    offerings_count: validatedOfferings.length,
    word_count: wordCount,
  });
console.log("--- GENERATION SUCCESSFUL ---");

return NextResponse.json({
  content: parsed.content,
  hashtags: parsed.hashtags,
  currentWeather,
  
  // NEW structured fields
  post_type: postType,
  content_category: parsed.content_category,
  content_summary: parsed.content_summary,
  offerings_referenced: validatedOfferings,
  event_referenced: parsed.event_referenced || null,
  hook_used: parsed.hook_used || null,
  voice_used: voice,
  ai_provider: providerUsed,
  word_count: wordCount,
  tokens_used: tokensUsed, // from your provider response
  
  // Legacy
  cognitive_lens: lens,
});

} catch (error: any) {
console.error("--- Shoreline ENGINE CRASH REPORT ---");
console.error("Provider:", process.env.AI_PROVIDER);
console.error("Error:", error.message);

// Friendly error for the user
const status = error?.status === 429 ? 429 : 500;
const message = status === 429 ? "Rate limit reached. Try again in a minute." : "Generation failed.";

return NextResponse.json({ error: message }, { status });
}
}