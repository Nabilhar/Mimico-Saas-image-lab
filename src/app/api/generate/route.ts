import { 
  GoogleGenerativeAI, 
  HarmCategory, 
  HarmBlockThreshold 
} from "@google/generative-ai";
import { NextResponse } from "next/server";
import Groq from "groq-sdk"; // <-- NEW
import { createClient } from '@supabase/supabase-js';
import { getFramework, BUSINESS_ARCHETYPES } from "@/lib/frameworks";
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

      // --- THE MOOD ANCHOR & SEMANTIC NUANCE ---
    const moodInstruction = colorTheme?.description 
        ? `BRAND MOOD & COLOR PSYCHOLOGY:
        The brand's visual identity is defined by: "${colorTheme.description}".
        CRITICAL: Use this palette to guide your vocabulary. If the palette is sophisticated/dark, use elegant and authoritative language. If the palette is bright/vibrant, use energetic and punchy language. Let the "vibe" of the colors shape your word choice.`
        : `BRAND MOOD:
        The brand is currently in a neutral/natural phase. Use welcoming, authentic, and community-focused language that feels organic and unpretentious.`;

    const visualDetails = businessVisuals 
          ? `BRAND VISUAL DETAILS:
        - Logo: ${businessVisuals.logoColors}
        - Storefront: ${businessVisuals.storefrontColors}
        - Interior: ${businessVisuals.interiorColors}`
          : "";


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

    return `

                  FIRST INSTRUCTION — READ BEFORE ANYTHING ELSE:
                  The previous 3 posts all opened with a variation of "the bike-to-work buzz." 
                  This theme is now retired. Do not use it. Do not reference bikes, commuting, 
                  or cycling as your opening angle in this post.

    CRITICAL OUTPUT RULE: You must output ONLY the following, in this exact order:
        1. One <research> tag with keywords only
        2. You MUST use the provided Search tool to find REAL, CURRENT weather and CURRENT landmarks and trends for ${location} before writing.
        3. The social media post body
        4. Hashtags

        Do NOT output any reasoning, analysis, word counts, self-checks, or commentary. 
        If you need to think, do it silently before writing. Your visible output starts with <research>.

    You are a Marketing Master. Put yourself in the shoes of the owner of "${business_name}", a local ${niche} at ${location}.

    BRAND VISUAL IDENTITY:
    - Brand Color Palette: ${colorDesc}
    - Primary Color: ${primaryCol}
    - Secondary Color: ${secondaryCol}
    - Accent Color: ${accentCol}
    - Logo Colors: ${logoCol}
    - Storefront Colors: ${storefrontCol}
    - Interior Colors: ${interiorCol}

    You are writing this post yourself at time :${currentTime} / season : ${month} — in your own voice, from your own experience on the ground.
    You know your neighbours, your street, and your regulars by name.
    Write as someone who genuinely lives and works in this community, not as a marketer.
    One rule: even though you write from your own perspective, every sentence must still serve the reader — not just talk about yourself.
    
      OPENING LINE — HARD RULE:
    The following openings were used in the last 3 posts. 
    You are FORBIDDEN from starting with any of these themes, phrases, or angles:
    ${recentHistory || "No previous posts."}

    Do not reframe or rephrase these — start from a completely different observation, 
    moment, or angle. If the previous posts mentioned bikes, start with something 
    you see inside the shop. If they mentioned the weather, start with a customer 
    interaction. If they mentioned the street, start with a smell or sound instead.
    
    TASK:
    1. Open with a <research> tag containing: neighbourhood name + up to 3 landmark names + up to 2 current local trends. Keywords only, no sentences, max 20 words total.
       Format exactly like this: <research>Neighborhood Name: Landmark 1, Landmark 2, Local Trend 1, Local Trend 2</research>
    
    2. Immediately after the closing </research> tag, write the social media post. Nothing between the tag and the post.
    
    ${moodInstruction}

    ${visualDetails}

    SEASONALITY:
    It is currently ${month}. Let the season shape the mood — weather, what locals are doing, what feels timely right now.
    
    POST TYPE:
    ${postSpecificInstructions}
    
    BRAND VOICE — ${voice}:
    ${VOICE_PROMPTS[voice] || "Warm, conversational, and community-first."}
    
    FRAMEWORK — apply ${framework} exactly:
    ${FRAMEWORK_PROMPTS[framework] || FRAMEWORK_PROMPTS["PAS"]}


    
    POST RULES:
    - 130-180 words in the post body (the <research> block does not count)
    - Write in first person ("I" or "We")
    - First sentence must contain a natural-language search keyword (e.g. "local trend 1 in the neighborhood") — as a statement, not a hashtag
    - Short paragraphs, one blank line between each
    - The call to action must feel like the natural next thought in the story, not a closing instruction
      Wrong: ["Book your table tonight — link in bio."]
      Right: [A natural, low-pressure invitation that fits a ${niche}. e.g., "The chair is open if you need a refresh," or "We'll be here with the kettle on if you want to talk shop."]
    - NO PARROTING: Do not use any phrases found in the "Right/Wrong" examples of this prompt. Those are for structural guidance only. Use your own words to achieve the same feeling.
    - End with 3-4 hashtags on their own line: neighbourhood first, then niche, then broad
    - Max 3 emojis, only if they add meaning
    - Never stop mid-sentence. If you near your output limit, close the sentence and jump to hashtags.
    - Do NOT label sections ("Before:", "Problem:", "Attention:" etc.)
    - Do NOT output word counts, commentary, or self-evaluation
    
    BANNED PHRASES:
    "the bike-to-work buzz." , "I'm always", "After a day", "Juggling", "Finding a", "a stone's throw", "pour our hearts", "passionate about", "quality service", "reach out", "don't hesitate", "we pride ourselves"

    CRITICAL CTA LOGIC:
    - You are a ${niche}. Your invitation must be physically possible for this business.
    - NO RESTAURANT TALK: Do not mention tables, reservations, menus, or dining unless you are a food business.
    - If a Barbershop: Invite them to stop by for a refresh, a fresh cut, or to grab a chair.
    - If a Plumber: Reference getting things flowing or a quick house call.
    - If a Florist: Reference grabbing a bouquet or adding some color to the room.
    - THE FINAL WORD: Use the unique voice of a local owner, not the example text from the prompt.
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
      history

    } = body;

    if (!business_id) {
      console.error("CRITICAL ERROR: No business_id provided in request body.");
      return NextResponse.json({ error: "Missing business identity context." }, { status: 400 });
    }

      // --- ADD THIS DEBUG BLOCK ---
      console.log("--- M8V MEMORY CHECK ---");
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

    const tools = [{ googleSearch: {},},] as any;

    const currentTime = new Date().toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit', 
      hour12: true 
    });

// 1. READ THE HIDDEN SWITCH (Check your .env.local for AI_PROVIDER)
const provider = process.env.AI_PROVIDER || "gemini"; 
let rawResponse = "";

try {
  if (provider === "groq") {
    console.log("--- M8V ENGINE: ROUTING TO GROQ (LLAMA 3) ---");
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ 
          role: "system", 
          // FIX: No more hardcoded Mimico. We tell it exactly where it is.
          content: `You are a helpful assistant. Follow the user's instructions precisely and output only what is requested. Do not add explanations, preambles, or commentary.` 
        },
        { role: "user", content: finalPrompt }],
      model: "compound-beta-mini", // ← single web search, 3x faster than compound-beta
      temperature: 0.7,
      
    });

    rawResponse = chatCompletion.choices[0]?.message?.content || "";
  } 
  else if (provider === "gemma") {
    console.log("--- M8V ENGINE: ROUTING TO GEMMA 4 (26B MoE) ---");
    
    // Using the 26B Mixture-of-Experts model for the best balance of speed and logic
    const model = genAI.getGenerativeModel({ 
      model: "gemma-4-26b-a4b-it", 
      tools: tools // <--- INTEGRATING THE RESEARCH TOOL
    }, { apiVersion: 'v1beta' });

    const result = await model.generateContent({
      contents: [{ 
        role: "user", 
        parts: [{ 
          text: `Use your <research> thinking mode to check for current ${location} news or events including the current weather at ${currentTime} before writing: \n\n ${finalPrompt}` 
        }] 
      }],
      generationConfig: {
        temperature: 1.0, // Higher temp is better for the 'thinking' phase
        maxOutputTokens: 6000,
        thinkingConfig: {
        includeThoughts: true,
        thinkingLevel: "high" 
        },
      } as any,
    });
    
    rawResponse = result.response.text();


    // 2. LOGGING LOGIC (For your terminal eyes only)
    if (rawResponse.includes("<research>")) {
      console.log("\x1b[32m%s\x1b[0m", "--- [M8V RESEARCH LOG] ---");
      const researchMatch = rawResponse.match(/<research>([\s\S]*?)<\/research>/);
      console.log(researchMatch ? researchMatch[1].trim() : "Research tags found but content empty.");
    }

    if (rawResponse.includes("`")) {
      console.log("\x1b[36m%s\x1b[0m", "--- [M8V THINKING LOG] ---");
      // Grabs the content inside the backticks/thinking block
      const thinkingMatch = rawResponse.match(/`([\s\S]*?)`/); 
      console.log(thinkingMatch ? thinkingMatch[1].trim() : "Thinking block found but empty.");
    }
  }
  
  else {
    console.log("--- M8V ENGINE: ROUTING TO GOOGLE GEMINI ---");
    // We'll keep the v1 stable config here
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" }, { apiVersion: 'v1beta' });
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: finalPrompt }] }],
      generationConfig: {
        temperature: 0.8,
        maxOutputTokens: 1000,
      },
      // ADD THEM BACK HERE:
      safetySettings: [
        { 
          category: HarmCategory.HARM_CATEGORY_HARASSMENT, 
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE 
        },
        { 
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, 
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE 
        },
        { 
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, 
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE 
        },
        { 
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, 
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE 
        },
      ],
    });
    
    rawResponse = result.response.text();
  }
} catch (apiError: any) {
  // If the chosen API fails (like your 404 or a rate limit), we catch it here
  console.error(`--- ${provider.toUpperCase()} API ERROR ---`, apiError.message);
  throw apiError; // Send it to the main catch block below
}

// 2. SMART CLEANUP (Handles the <research> tags for BOTH models)
// 2. SMART CLEANUP (Handles the <research> tags for BOTH models)
let content = rawResponse;

// 3. THE CLEANUP PIPELINE

// Step A: Remove the "Thinking" or "Research" blocks
// This looks for <research>...</research> OR anything inside backticks `...`
if (content.includes("</research>")) {
  content = content.split("</research>").pop()?.trim() || content;
} else if (content.includes("`")) {
  // If it uses backticks for thinking, take the part AFTER the last backtick
  const parts = content.split("`").filter(p => p.trim().length > 10);
  content = parts[parts.length - 1].trim(); 
} else if (content.includes("<|think|>")) {
  // Handle specific model thinking tags
  content = content.split("<|think|>").pop()?.trim() || content;
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
console.error("--- M8V ENGINE CRASH REPORT ---");
console.error("Provider:", process.env.AI_PROVIDER);
console.error("Error:", error.message);

// Friendly error for the user
const status = error?.status === 429 ? 429 : 500;
const message = status === 429 ? "Rate limit reached. Try again in a minute." : "Generation failed.";

return NextResponse.json({ error: message }, { status });
}
}