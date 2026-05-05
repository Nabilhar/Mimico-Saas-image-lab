// generate/route

import { 
  GoogleGenerativeAI, 
  HarmCategory, 
  HarmBlockThreshold 
} from "@google/generative-ai";
import { NextResponse } from "next/server";
import Groq from "groq-sdk"; // <-- NEW
import { createClient } from '@supabase/supabase-js';
import { getFramework, BUSINESS_ARCHETYPES } from "@/lib/frameworks";
import { TIP_MODE, POST_TYPE_CTA_OVERRIDE, SEASONAL_NICHE_NARRATIVE, getSeason, NARRATIVE_COMBINATIONS, NarrativeEntry, ANGLE_POOL} from "@/lib/frameworks";
import { getBrandIdentity, discoverAndSaveBrandIdentity, parseBusinessIntel  } from "@/lib/brandDiscovery";
import { ColorTheme, BusinessVisuals } from '@/lib/constants';
import { auth } from "@clerk/nextjs/server"; 

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
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true&temperature_unit=celsius`
    );
    const data = await res.json();
    const cw = data.current_weather;
    const description = WMO_CODES[cw.weathercode] ?? "variable conditions";
    const temp = Math.round(cw.temperature);
    return `${temp}°C, ${description} in ${city}`;
  } catch {
    return "";
  }
}

// ─────────────────────────────────────────────
// 3. VOICE DEFINITIONS
// Matches the exact voice strings sent from the frontend.
// ─────────────────────────────────────────────

const VOICE_PROMPTS: Record<string, string> = {
  "Authoritative & Precise": "Authoritative, factual, confident. Light industry terms. No exclamation marks. Trust through knowledge, not enthusiasm. Never use 'excited', 'thrilled', or 'delighted'. This is a style modifier — the post structure is defined separately.",
  "Warm & Conversational": "Warm, conversational, community-first. Friend-like tone. Use 'we' and 'you'. Non-corporate. Short sentences. Never ramble or hedge. This is a style modifier — the post structure is defined separately.",
  "Bold & Direct": "High-energy, direct, urgent. Short, punchy sentences. Bold claims. Drives immediate action. Sparse emphasis. This is a style modifier — the post structure is defined separately.",
  "Clean & Understated": "Clean, understated, sophisticated. Zero filler. Every sentence must earn its place. This is a style modifier — the post structure is defined separately.",
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: THE PROVIDER CALLER
// This encapsulates the actual API calls so the router can call them in a loop
// ─────────────────────────────────────────────────────────────────────────────
async function callAIProvider(provider: string, finalPrompt: string, currentTime: string, address: any) {
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
    console.log("--- GROQ FINISH REASON:", chatCompletion.choices[0]?.finish_reason);
    console.log("--- GROQ CONTENT:", groqContent);
    return groqContent || "";
  } 

    // ───────────────────────────────────────────────────────────────────────────
  // NEW CLAUDE PROVIDER
  // ───────────────────────────────────────────────────────────────────────────

  if (provider === "anthropic") {
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
    console.log("--- ANTHROPIC FINISH REASON:", data.stop_reason);
    return content || "";
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
    return result.response.text();
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

    return result.response.text();
  }
  
  throw new Error(`Unsupported provider: ${provider}`);
}

// ─────────────────────────────────────────────
// 4. PROMPT BUILDER
// Owner-perspective persona + <research> tags + seasonality
// + keyword-first caption + framework all assembled here.
// ─────────────────────────────────────────────

function buildPrompt(
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
  currentWeather: string

): string {


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

    const tipModeInstruction = postType === "5 Tips"
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

  const ctaOverride = POST_TYPE_CTA_OVERRIDE[postType] || "";

  const wordCount = postType === "5 Tips" 
  ? "200-260" 
  : postType === "Community moment" 
    ? "110-150" 
    : "130-180";

  const currentTime = new Date().toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit', 
    hour12: true 
  });

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
  Craft: ${intel.craft_identity}
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
  

    const roleInstruction = postType === "Community moment"
      ? `You are the owner of "${business_name}", a ${niche} at ${fullAddress}.
          Write in your own voice — observational, not educational.
          You notice what happens in the room. You see the scene — you don't explain it or sell it.
          Describe what people do and feel. The business is the backdrop that makes the moment possible.`
      : `You are the owner of "${business_name}", a ${niche} at ${fullAddress}.
          Write in your own voice — from experience, not enthusiasm.
          Do not describe what customers do, feel, or think. State craft truth directly.`;

    return `

      [ROLE]: ${roleInstruction}

      [BUSINESS]:
      ${coreIntel}

      [TONE]: ${VOICE_PROMPTS[voice] || "Warm, community-first."}

      [SEASONAL_GUIDE]: ${seasonalNicheGuidance}

      ${visualIdentity}

      ${localFacts}

      [TASK]:
      ${selectedAngle
        ? `Open with one specific craft truth earned through years of practice — not findable online.
      Start from it directly. No introduction. First sentence is about the craft, not people.

      A valid craft truth includes at least one of:
      - A constraint (what cannot be done and why)
      - A trade-off (what is sacrificed for a better result)
      - A threshold (when something changes in quality)
      - A correction (what most people get wrong, stated directly)

      ${selectedAngleText ? `[ANGLE]: "${selectedAngleText}" — use this as the specific lens for the craft truth. Do not quote it directly. Let it shape the angle of the opening.` : ""}`
        : `Let the offer in [POST_SPECIFICS] drive the opening naturally.`
      }
      
      1. Connect this angle to the post type and voice.
      2. Check [LOCAL_GROUND_TRUTH] for one detail that sharpens the angle — use only if natural.
      3. Anchor to ONE offering from Offerings. Avoid offerings in [VARIETY RULES]. It grounds the post — not the subject of any tip.
      4. Let season, time, and weather colour the language — not override the craft truth.
          ${currentTime} | ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} | ${currentWeather ? `${currentWeather} — one grounded moment only.` : ""}
      5. Write the post. Add 3-4 hashtags.

      [POST_SPECIFICS]:
      Type: ${postType}
      ${tipModeInstruction ? `Tip Mode: ${tipModeInstruction}\n` : ""}
      ${narrative}

      [HARD CONSTRAINTS]:
      - ${wordCount} words. 1st person. Short paragraphs, double-spaced.
      - Max 3 emojis in body only. Never in hashtags.
      - No labels (e.g. "Hook:", "Tip 1:"). No commentary or word counts.
      - No competing business references.
      - ${postType === "Myth-busting" ? "No CTA of any kind." : `CTA: low-pressure, physically possible for a ${niche}.`}
      - ${ctaOverride || ""}

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
      If all offerings used recently — pick least recently used. If all landmarks used — use none.

      [OUTPUT]: <<<POST_BEGIN>>> then post body then hashtags. Nothing else.

`;}

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
      postType = "5 Tips", 
      promoType = "discount",    // <-- Make sure these are here
      eventType = "event",    // <-- Make sure these are here
      customDetails = "", // <-- Make sure these are here
      history: postHistory,
      provider: requestedProvider

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

    
    const { data: business, error: businessError  } = await supabase
    .from('businesses')
    .select(' id, business_name, street, city, province_state, country, postal_code, business_description, color_theme, business_visuals,storefront_architecture, interior_layout')
    .eq('user_id', userId)
    .eq('is_active', true)
    .single();

    if (businessError  || !business) {
      return NextResponse.json({ error: "Business profile not found. Please complete your profile." }, { status: 404 });
    }

    // 1. Parse the Librarian data once
    const intel = parseBusinessIntel(business.business_description);

    // 2. Check if we are missing visuals OR if the description is still legacy (not JSON)
    const isStructured = intel?.isJson || false;

    if (!business.color_theme || !business.business_visuals || !isStructured) {
      console.log("--- SINGLE SOURCE CHECK: Triggering background upgrade ---");
      discoverAndSaveBrandIdentity(business.id, business.business_name, {
        street: business.street,
        city: business.city,
        province_state: business.province_state,
        country: business.country,
        postalCode: business.postal_code 
        },
        [],        // no photos in background trigger
        category,  // from profile
        niche      // from profile
      ).catch(err => console.error("Background Discovery Error:", err));
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

    const uniqueUsedOfferings = [...new Set(usedOfferings)] as string[];
    const uniqueUsedLandmarks = [...new Set(usedLandmarks)] as string[];

    const varietyRules = [
      uniqueUsedOfferings.length
        ? `  - Products/offerings to avoid: ${uniqueUsedOfferings.join(", ")}`
        : "  - No recent product patterns to avoid.",
      uniqueUsedLandmarks.length
        ? `  - Landmarks to avoid: ${uniqueUsedLandmarks.join(", ")}`
        : "  - No recent landmark patterns to avoid.",
    ].join("\n");

    // Auto-select framework — user never has to choose
    const framework = getFramework(category, postType, voice) || "PAS";
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

    // Build the final prompt
    const finalPrompt = buildPrompt(
      business.business_name,
      category,
      niche,
      business,   
      voice,
      postType,
      framework,
      month,
      recentHistory,
      promoType || "",    // Argument 9
      eventType || "",    // Argument 10
      customDetails || "", // Argument 11
      business.color_theme,   
      business.business_visuals,
      business.business_description,
      varietyRules,
      currentWeather
    );

    // ── MOCK MODE (delete before going to production) ─────
    if (process.env.NEXT_PUBLIC_MOCK_AI === "true") {
      await new Promise((resolve) => setTimeout(resolve, 800));
      return NextResponse.json({
        content: `<research>TEST MODE: ${business.city} | Framework: ${framework} | Month: ${month}</research>\n\nThis is a mock post for ${business_name} in ${business.city}. Framework auto-selected: ${framework}. No API tokens used.`,
        framework,
      });
    }
    // ─────────────────────────────────────────────────────

    const currentTime = new Date().toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit', 
      hour12: true 
    });

  
    // ─────────────────────────────────────────────────────────────────────────────
    // THE SMART ROUTER LOGIC
    // ─────────────────────────────────────────────────────────────────────────────
    const engineMode = process.env.AI_ENGINE_MODE || "FALLBACK"; 
    let rawResponse = "";

    if (engineMode === "TOGGLE") {
      // DEVELOPMENT MODE: Use exactly what the user toggled in the UI
      const providerToUse = requestedProvider || process.env.AI_PROVIDER || "gemini";
      console.log(`--- Shoreline MODE: TOGGLE [Using ${providerToUse}] ---`);
      rawResponse = await callAIProvider(providerToUse, finalPrompt, currentTime, business);
      console.log("--- RAW RESPONSE ---");
      console.log(rawResponse);
      console.log("--- END RAW RESPONSE ---");
    } else {
      // LAB/PRODUCTION MODE: Robust Fallback Chain
      console.log("--- Shoreline MODE: FALLBACK CHAIN ---");
      const fallbackChain = ["anthropic", "openrouter", "deepinfra"];
      let success = false;

      for (const provider of fallbackChain) {
        try {
          rawResponse = await callAIProvider(provider, finalPrompt, currentTime, business);
          if (rawResponse) {
            success = true;
            break; // Stop the loop as soon as we get a successful response
          }
        } catch (e) {
          console.warn(`Provider ${provider} failed. Moving to next in chain...`);
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
    const localContextMatch = rawResponse.match(/\[LOCAL_CONTEXT:[\s\S]*?\]/);
    if (localContextMatch) {
      console.log("\x1b[32m%s\x1b[0m", "--- [Shoreline LOCAL CONTEXT] ---");
      console.log(localContextMatch[0]);
    }
// 2. SMART CLEANUP (Handles the <research> tags for BOTH models)
// 2. SMART CLEANUP (Handles the <research> tags for BOTH models)

let content = rawResponse;

const signal = "<<<POST_BEGIN>>>";

if (content.includes(signal)) {
  // Find the last occurrence of the signal to skip all "thinking" versions
  const lastSignalIndex = content.lastIndexOf(signal);
  content = content.substring(lastSignalIndex + signal.length).trim();
} else {
  // FALLBACK: If the AI missed the signal, use the old split method
  content = content.replace(/\[LOCAL_CONTEXT:[\s\S]*?\]/g, "").trim();
}
// Step B: Nuclear Scrub
// This removes any stray tags, citations, or metadata
content = content
  .replace(/<[^>]*>/g, "")      // Removes any remaining <tag> markers
  .replace(/\[\d+\]/g, "")      // Removes citations like [1], [2], [3]
  .replace(/^>+\s*/gm, "")  // strips >> or >>> at the start of any line
  .replace(/\s*>+$/gm, "")  // strips >> or >>> at the end of any line
  .replace(/\*\*(.*?)\*\*/g, "$1")  // Remove **bold**
  .replace(/\*(.*?)\*/g, "$1")      // Remove *italic*
  .replace(/Word Count:\s*\d+/gi, "") // Removes "Word Count: 150"
  .replace(/Keywords?:\s*[\s\S]*?(\n|$)/gi, "") // Removes "Keywords: ..."
  .trim();

// Step C: Formatting Polish
content = content
  .replace(/([.!?])\s+(?=[1-5]\.)/g, "$1\n\n") // Ensures a gap before numbered lists
  .replace(/(\d\.)\s+/g, "$1 ")                // Ensures space after numbers (e.g., "1. Tip" vs "1.Tip")
  .replace(/\n(?=[1-5]\.)/g, "\n")             // Keeps lists compact
  .replace(/(#\w+)/g, "\n\n$1")                // Pushes hashtags to their own line
  .replace(/(#\w+)\s+(?=#\w+)/g, "$1 ");       // Keeps hashtags together on one line

// Step D: Final Cleanup of Triple Newlines
content = content.replace(/\n{3,}/g, "\n\n").trim();

// Final content validation
if (!content || content.trim().length < 80) {
  console.error("--- CLEANED CONTENT TOO SHORT — ABORTING ---");
  console.error(`Cleaned content: "${content}"`);
  return NextResponse.json(
    { error: "Generation failed — post content was incomplete. Please try again." },
    { status: 500 }
  );
}

console.log("--- GENERATION SUCCESSFUL ---");
return NextResponse.json({ content, framework, currentWeather });

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