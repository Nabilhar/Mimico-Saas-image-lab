// generate/route

import { 
  GoogleGenerativeAI, 
  HarmCategory, 
  HarmBlockThreshold 
} from "@google/generative-ai";
import { NextResponse } from "next/server";
import Groq from "groq-sdk"; // <-- NEW
import { createClient } from '@supabase/supabase-js';
import { getFramework, BUSINESS_ARCHETYPES,getFrameworkTipsStructure  } from "@/lib/frameworks";
import { SEASONALITY_CONTEXT, SEASONAL_NICHE_NARRATIVE, getSeason } from "@/lib/frameworks";
import { getBrandIdentity, discoverAndSaveBrandIdentity } from "@/lib/brandDiscovery";
import { ColorTheme, BusinessVisuals } from '@/lib/constants';

// 1. Initialize Groq (The New Engine)
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// 2. Initialize Gemini (The Original Engine)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Use the SECRET key, not the ANON key
);

// ─────────────────────────────────────────────
// 1. FRAMEWORK AUTO-SELECTION
// Maps business category + post type → best framework.
// Three universal overrides run first:
//   "Myth-busting"      → always PAS  (myth = problem by definition)
//   "Behind the scenes" → always BAB  (transparency = aspiration)
//   "The Hustler" voice → always PAS  (urgency is its natural mode)
// ─────────────────────────────────────────────


// ─────────────────────────────────────────────
// 2. FRAMEWORK PROMPT DEFINITIONS
// Each block is a precise structural contract for the AI.
// No framework labels appear in the output —
// the AI follows the structure invisibly.
// ─────────────────────────────────────────────

const FRAMEWORK_PROMPTS: Record<string, string> = {
  PAS: `Use the PAS structure (Problem-Agitate-Solve) — do not label the sections in the post:
- Open with one sharp sentence naming a pain the reader already feels. Make it specific to someone near this location. No generic openers like "Are you tired of..."
- Follow with one sentence only on the real cost of ignoring that problem — financial, physical, or emotional. Make the reader feel the consequence.
- Close by introducing the business as the natural fix. Weave in the local landmark naturally. End with one clear, low-friction CTA.`,

  BAB: `Use the BAB structure (Before-After-Bridge) — do not label the sections in the post:
- Open with one relatable sentence placing the reader in their ordinary, imperfect reality. Familiar and grounded — not dramatic.
- Follow with one sensory, specific sentence showing life after engaging with this business — what they see, feel, or can actually do. Not a vague "you'll feel better."
- Close with 2-3 sentences bridging those two states through the business. Weave the local landmark in naturally as proof of community presence. End with one warm, low-pressure CTA.`,

  AIDA: `Use the AIDA structure (Attention-Interest-Desire-Action) — do not label the sections in the post:
- Open with one bold, local hook — a surprising neighbourhood fact, a specific location reference, or a strong claim. If it wouldn't stop a scroll, it is not strong enough.
- Follow with 1-2 sentences on why this matters right now in this community — seasonal, local, timely.
- Build want through a specific result, proof point, or local credential. Reference the landmark here to anchor credibility.
- Close with one direct CTA. Pick one action only — DM a keyword, click the link, call, or book. Never two options.`,
};

// ─────────────────────────────────────────────
// 3. VOICE DEFINITIONS
// Matches the exact voice strings sent from the frontend.
// ─────────────────────────────────────────────

const VOICE_PROMPTS: Record<string, string> = {
  "The Expert":
    "Authoritative, factual, confident. Uses industry terms lightly. No exclamation marks. Builds trust through knowledge, not enthusiasm.",
  "The Neighbor":
    "Warm, conversational, community-first. Reads like a message from a friend who runs the business. Uses 'we' and 'you' naturally. Never corporate.",
  "The Hustler":
    "High-energy, direct, urgent. Short punchy sentences. Bold claims. Drives immediate action. Emphasis used sparingly but powerfully.",
  "The Minimalist":
    "Clean, understated, sophisticated. Says more with less. No filler words. Every sentence earns its place.",
};

const POST_TYPE_PROMPTS: Record<string, any> = {

  
  "5 Tips": `Write a post that delivers exactly 5 numbered tips. 
Each tip must be one punchy, actionable sentence — no fluff. 
The tips should be genuinely useful to someone near this location, 
not generic advice they could find anywhere. 
The framework structure applies to how the tips are introduced and closed, 
not to each individual tip.`,

  "Myth-busting": `Write a post that busts one specific, common misconception 
about this business or industry. 
State the myth clearly in the opening (without saying "myth:"). 
Correct it with confidence and a local proof point. 
The reader should finish the post thinking "I didn't know that."`,

  "Behind the scenes": `Write a post that pulls back the curtain on one specific, 
ordinary moment in the business owner's day — 
a morning routine, a preparation ritual, a small detail most customers never see. 
Make it feel like a privilege to read. Specific beats generic: 
"4am sourdough proofing" beats "we work hard every day."`,


"Promotion / offer": (promoType: string, details: string, location: string) => {
  const strategies = {
    discount: "Act like a friend giving a neighbor a 'heads up' on a way to save. Focus on the ease of the transaction. Use words like 'lighter on the wallet' or 'a little break'.",
    freebie: "Act like a generous host. The focus is 100% on hospitality and 'our treat'. It's about a gift, not a transaction. Use words like 'on the house' or 'tucked in for you'.",
    custom: "Focus on the 'Why now?'. Is it a rainy day special? A celebration of a local milestone? Create a 'just for us' community feeling."
  };
  
  return `
    [GOAL]: Announce a ${promoType} without sounding like a flyer.
    [DATA]: ${details}
    [TONE]: ${strategies[promoType as keyof typeof strategies] || "Neighborly and warm."}
    [STRICT RULE]: The details "${details}" must be the center of the story, but woven in as a solution to a specific ${location} moment (e.g., a post-work treat or a weekend reward).

Rules:
- "CRITICAL: You MUST use the following specific details: '${details}'. If these details are missing from the post, the post is a failure. Do not use generic placeholders like [Insert Date]."
- The post must make the reader feel like a neighbour getting a genuine heads-up, not a customer seeing an ad.
- The specific detail (price, date, quantity, condition) must appear naturally in the post body — not just in the CTA.
- Never say "limited time offer" — if there's a limit, show it ("only until Sunday", "last 10 spots", "this week only").
- To claim the offer, the reader should just "show this post on their phone" when they arrive. Example : "Just let the team know you're a neighbor and show them this post." 
    `;
},


"Local event / news": (eventType: string, details: string, location: string) => {
    return `
      [GOAL]: Position the business as the neighborhood's information hub for this ${eventType}.
      [DATA]: ${details}
      [NARRATIVE]: Don't just report the news. Explain why it matters to someone standing on Lake Shore Blvd right now. 
      [STRICT RULE]: If it's an event, the call to action should be about 'stopping by on your way to/from' the event.
    
    Rules:
- The promotion details above are real — use them exactly, do not invent numbers or dates.
- The post must make the reader feel like a neighbour getting a genuine heads-up, not a customer seeing an ad.
- The specific detail (price, date, quantity, condition) must appear naturally in the post body — not just in the CTA.
- Never say "limited time offer" — if there's a limit, show it ("only until Sunday", "last 10 spots", "this week only").
- End with one clear action the reader takes to claim the offer.
      `;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: THE PROVIDER CALLER
// This encapsulates the actual API calls so the router can call them in a loop
// ─────────────────────────────────────────────────────────────────────────────
async function callAIProvider(provider: string, finalPrompt: string, currentTime: string, location: string) {
  if (provider === "groq") {
    console.log("--- Shoreline ENGINE: ROUTING TO GROQ (LLAMA 3) ---");
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: `You are a helpful assistant. Follow the user's instructions precisely and output only what is requested.` },
        { role: "user", content: finalPrompt }
      ],
      model: "compound-beta-mini",
      temperature: 0.7,
    });
    return chatCompletion.choices[0]?.message?.content || "";
  } 
  
  if (provider === "gemma") {
    console.log("--- Shoreline ENGINE: ROUTING TO GEMMA 4 (26B MoE) ---");
    const tools = [{ googleSearch: {} }] as any;
    const model = genAI.getGenerativeModel({ 
      model: "models/gemma-4-26b-a4b-it", 
      tools: tools 
    }, { apiVersion: 'v1beta' });

    const result = await model.generateContent({
      contents: [{ 
        role: "user", 
        parts: [{ text: `Use your <research> thinking mode to check for current ${location} news or events including the current weather at ${currentTime} before writing: \n\n ${finalPrompt}` }] 
      }],
      generationConfig: {
        temperature: 1.0,
        maxOutputTokens: 6000,
        thinkingConfig: { includeThoughts: true, thinkingLevel: "medium" }, // Optimized to medium for speed
      } as any,
    });
    return result.response.text();
  } 
  
  if (provider === "gemini") {
    console.log("--- Shoreline ENGINE: ROUTING TO GOOGLE GEMINI ---");
    const model = genAI.getGenerativeModel({ model: "models/gemini-2.5-flash"  }); 
    
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: finalPrompt }] }],
      generationConfig: { temperature: 0.8, maxOutputTokens: 1000 },
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
  niche: string,
  location: string,
  voice: string,
  postType: string,
  framework: string,
  month: string,
  recentHistory: string | null, 
  promoType: string,
  eventType: string,
  customDetails: string,
  colorTheme: ColorTheme | null,
  businessVisuals: BusinessVisuals | null

): string {


  const rawInstruction = POST_TYPE_PROMPTS[postType] 

  // Check: If it's a function, call it. If it's a string, use it as is.
  const postSpecificInstructions = typeof rawInstruction === "function"
    ? rawInstruction(postType === "Promotion / offer" ? promoType : eventType, customDetails, location)
    : rawInstruction;

  const currentTime = new Date().toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit', 
    hour12: true 
  });

// Handle the "New User" scenario: If no colors exist, tell the AI to derive them from research.
  const visualIdentity = `
  [VISUALS]:
  Palette: ${colorTheme?.primary || "Auto-detect"}, ${colorTheme?.secondary || "Auto-detect"}, ${colorTheme?.accent || "Auto-detect"}
  Mood: ${colorTheme?.description || "Derive from research/niche"}
  Details: Logo(${businessVisuals?.logoColors || "N/A"}), Store(${businessVisuals?.storefrontColors || "N/A"}), Interior(${businessVisuals?.interiorColors || "N/A"})
  RULE: Match vocabulary to this palette. If "Auto-detect" is listed, use your <research> findings to determine the brand's visual vibe and match your language to it.`;


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

    const season = getSeason(month); // Ensure you have a getSeason helper
    const seasonalNicheGuidance = SEASONAL_NICHE_NARRATIVE[season]?.[niche] || "";
  

    return `

[SYSTEM]: Marketing Master. Persona: Owner of "${business_name}" (${niche}) in ${location}.
[TONE]: ${VOICE_PROMPTS[voice] || "Warm, community-first."}
[CONTEXT]: Time: ${currentTime} | Month: ${month} | Season: ${season}
[SEASONAL_GUIDE]: ${seasonalNicheGuidance}
${visualIdentity}

[ANTI_PATTERNS]:
- DO NOT use these opening themes/phrases: ${recentHistory || "None"}
- BANNED: "bike-to-work buzz", "I'm always", "After a day", "Juggling", "Finding a", "stone's throw", "pour our hearts", "passionate about", "quality service", "reach out", "don't hesitate", "pride ourselves", "No cap", "Slay", "It's giving", "That's a wrap", "Are you tired of", "Don't miss out", "Limited time offer"

[TASK]:
1. <research>Neighborhood Name: Landmark 1, Landmark 2, Local Trend 1, Local Trend 2</research> (Max 20 words)
2. Social Media Post
3. 3-4 Hashtags (Neighborhood, Niche, Broad)

[POST_SPECIFICS]:
Type: ${postType}
Framework: ${framework} (${FRAMEWORK_PROMPTS[framework] || FRAMEWORK_PROMPTS["PAS"]})
Instruction: ${postSpecificInstructions}
${postType === "5 Tips" ? `Structure: ${getFrameworkTipsStructure(framework as any)}` : ""}

[CONSTRAINTS]:
- Length: 130-180 words.
- POV: 1st Person ("I"/"We").
- Hook: First sentence must include a natural local keyword/trend.
- Formatting: Short paragraphs, double spacing between them.
- CTA: Low-pressure, physically possible for a ${niche}. No "Book now" or "Link in bio" unless naturally woven.
- No labels (e.g., no "Problem:", "Tip 1:").
- No commentary, word counts, or self-evaluation.
- Max 3 emojis.

[OUTPUT_ORDER]: 
1. <research> tag (contain keywords only)
2. The signal: [FINAL_POST_START]
3. The social media post body
4. Hashtags
(Do not include any other symbols, arrows, or labels)

`;}

// ─────────────────────────────────────────────
// 5. API ROUTE HANDLER
// ─────────────────────────────────────────────

export async function POST(req: Request) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return NextResponse.json({ error: "Missing API Key" }, { status: 500 });
  }

  try {
    const body = await req.json();
    const {
      business_name,
      location,
      business_id,
      category,
      niche,
      voice,
      postType = "5 Tips", 
      promoType = "discount",    // <-- Make sure these are here
      eventType = "event",    // <-- Make sure these are here
      customDetails = "", // <-- Make sure these are here
      history,
      provider: requestedProvider

    } = body;

    if (!business_id) {
      console.error("CRITICAL ERROR: No business_id provided in request body.");
      return NextResponse.json({ error: "Missing business identity context." }, { status: 400 });
    }

      // --- ADD THIS DEBUG BLOCK ---
      console.log("--- Shoreline MEMORY CHECK ---");
      if ( history && history.length > 0) {
        console.log(`Found ${history.length} previous posts.`);
        history.slice(0, 3).forEach((p: any, i: number) => {
          const firstSentence = (p.content || "").split(/[.!?]/)[0].trim();
          console.log(`Post ${i + 1} opening: "${firstSentence}"`);
        });

      } else {
        console.log("NO HISTORY FOUND. Generating from scratch.");
      }
      console.log("-----------------------");

        // --- PHASE 1: THE FAST PATH ---
    // Get existing brand identity from DB (Fast, no search)
    const brandIdentity = await getBrandIdentity(business_id);

    // --- PHASE 2: THE BACKGROUND PATH ---
    // If identity is missing, trigger the researcher in the background.
    // NOTICE: We do NOT 'await' this. It runs in parallel.
    if (!brandIdentity.color_theme || !brandIdentity.business_visuals) {
      console.log("--- MISSING BRAND DATA: Triggering background research ---");
      discoverAndSaveBrandIdentity(business_id, business_name, location)
        .catch(err => console.error("Background Discovery Error:", err));
    }

    const recentHistory = history?.length
    ? history
        .slice(0, 3) // Just take the last 5 for the AI context
        .map((p: any, i: number) => {
          const firstSentence = (p.content || "").split(/[.!?]/)[0].trim();
          return `- Post ${i + 1} opening: "${firstSentence}"`;
        })
        .join("\n")
    : "No previous posts found.";

    // Auto-select framework — user never has to choose
    const framework = getFramework(category, postType, voice) || "PAS";
    console.log("Using Framework:", framework);

    // Inject current month for seasonality
    const month = new Date().toLocaleString("en", { month: "long" });

    // Build the final prompt
    const finalPrompt = buildPrompt(
      business_name,
      niche,
      location,
      voice,
      postType,
      framework,
      month,
      recentHistory,
      promoType || "",    // Argument 9
      eventType || "",    // Argument 10
      customDetails || "", // Argument 11
      brandIdentity.color_theme,
      brandIdentity.business_visuals
    );

    // ── MOCK MODE (delete before going to production) ─────
    if (process.env.NEXT_PUBLIC_MOCK_AI === "true") {
      await new Promise((resolve) => setTimeout(resolve, 800));
      return NextResponse.json({
        content: `<research>TEST MODE: ${location} | Framework: ${framework} | Month: ${month}</research>\n\nThis is a mock post for ${business_name} in ${location}. Framework auto-selected: ${framework}. No API tokens used.`,
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
      rawResponse = await callAIProvider(providerToUse, finalPrompt, currentTime, location);
    } else {
      // LAB/PRODUCTION MODE: Robust Fallback Chain
      console.log("--- Shoreline MODE: FALLBACK CHAIN ---");
      const fallbackChain = ["groq", "gemini", "gemma"];
      let success = false;

      for (const provider of fallbackChain) {
        try {
          rawResponse = await callAIProvider(provider, finalPrompt, currentTime, location);
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
    // LOGGING & CLEANUP
    // ─────────────────────────────────────────────────────────────────────────────
if (rawResponse.includes("<research>")) {
  console.log("\x1b[32m%s\x1b[0m", "--- [Shoreline RESEARCH LOG] ---");
  const researchMatch = rawResponse.match(/<research>([\s\S]*?)<\/research>/);
  console.log(researchMatch ? researchMatch[1].trim() : "Empty research.");
}
// 2. SMART CLEANUP (Handles the <research> tags for BOTH models)
// 2. SMART CLEANUP (Handles the <research> tags for BOTH models)

let content = rawResponse;

const signal = "[FINAL_POST_START]";

if (content.includes(signal)) {
  // Find the last occurrence of the signal to skip all "thinking" versions
  const lastSignalIndex = content.lastIndexOf(signal);
  content = content.substring(lastSignalIndex + signal.length).trim();
} else {
  // FALLBACK: If the AI missed the signal, use the old split method
  if (content.includes("</research>")) {
    content = content.split("</research>").pop()?.trim() || content;
  } else if (content.includes("`")) {
    const parts = content.split("`").filter(p => p.trim().length > 10);
    content = parts[parts.length - 1].trim();
  }
}
// Step B: Nuclear Scrub
// This removes any stray tags, citations, or metadata
content = content
  .replace(/<[^>]*>/g, "")      // Removes any remaining <tag> markers
  .replace(/\[\d+\]/g, "")      // Removes citations like [1], [2], [3]
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

console.log("--- GENERATION SUCCESSFUL ---");
return NextResponse.json({ content, framework });

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