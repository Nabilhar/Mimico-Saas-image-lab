import { 
  GoogleGenerativeAI, 
  HarmCategory, 
  HarmBlockThreshold 
} from "@google/generative-ai";
import { NextResponse } from "next/server";
import Groq from "groq-sdk"; // <-- NEW
import { createClient } from '@supabase/supabase-js';
import { getFramework } from "@/lib/frameworks";

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

const BUSINESS_ARCHETYPES: Record<string, string> = {
  "Health & Wellness":       "pain-driven",
  "Home Services":           "pain-driven",
  "Automotive":              "pain-driven",
  "Trades & Industrial":     "pain-driven",
  "Food & Beverage":         "lifestyle",
  "Beauty & Personal Care":  "lifestyle",
  "Fitness & Recreation":    "lifestyle",
  "Retail":                  "lifestyle",
  "Pets":                    "lifestyle",
  "Events & Hospitality":    "lifestyle",
  "Professional Services":   "considered-purchase",
  "Real Estate & Property":  "considered-purchase",
  "Education & Childcare":   "considered-purchase",
  "Technology":              "considered-purchase",
};

// ─────────────────────────────────────────────
// 2. FRAMEWORK PROMPT DEFINITIONS
// Each block is a precise structural contract for the AI.
// No framework labels appear in the output —
// the AI follows the structure invisibly.
// ─────────────────────────────────────────────

const FRAMEWORK_PROMPTS: Record<string, string> = {
  PAS: `Use the PAS structure — do not label the sections in the post:
- Open with one sharp sentence naming a pain the reader already feels. Make it specific to someone near this location. No generic openers like "Are you tired of..."
- Follow with one sentence only on the real cost of ignoring that problem — financial, physical, or emotional. Make the reader feel the consequence.
- Close by introducing the business as the natural fix. Weave in the local landmark naturally. End with one clear, low-friction CTA.`,

  BAB: `Use the BAB structure — do not label the sections in the post:
- Open with one relatable sentence placing the reader in their ordinary, imperfect reality. Familiar and grounded — not dramatic.
- Follow with one sensory, specific sentence showing life after engaging with this business — what they see, feel, or can actually do. Not a vague "you'll feel better."
- Close with 2-3 sentences bridging those two states through the business. Weave the local landmark in naturally as proof of community presence. End with one warm, low-pressure CTA.`,

  AIDA: `Use the AIDA structure — do not label the sections in the post:
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


"Promotion / offer": (promoType: string, details: string) => {
  const strategies = {
    discount: "Act like a friend giving a neighbor a 'heads up' on a way to save. Focus on the ease of the transaction. Use words like 'lighter on the wallet' or 'a little break'.",
    freebie: "Act like a generous host. The focus is 100% on hospitality and 'our treat'. It's about a gift, not a transaction. Use words like 'on the house' or 'tucked in for you'.",
    custom: "Focus on the 'Why now?'. Is it a rainy day special? A celebration of a local milestone? Create a 'just for us' community feeling."
  };
  
  return `
    [GOAL]: Announce a ${promoType} without sounding like a flyer.
    [DATA]: ${details}
    [TONE]: ${strategies[promoType as keyof typeof strategies] || "Neighborly and warm."}
    [STRICT RULE]: The details "${details}" must be the center of the story, but woven in as a solution to a specific Mimico moment (e.g., a post-work treat or a weekend reward).

Rules:
- "CRITICAL: You MUST use the following specific details: '${details}'. If these details are missing from the post, the post is a failure. Do not use generic placeholders like [Insert Date]."
- The post must make the reader feel like a neighbour getting a genuine heads-up, not a customer seeing an ad.
- The specific detail (price, date, quantity, condition) must appear naturally in the post body — not just in the CTA.
- Never say "limited time offer" — if there's a limit, show it ("only until Sunday", "last 10 spots", "this week only").
- To claim the offer, the reader should just "show this post on their phone" when they arrive. Example : "Just let the team know you're a neighbor and show them this post." 
    `;
},


"Local event / news": (eventType: string, details: string) => {
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
  customDetails: string  
): string {

  const rawInstruction = POST_TYPE_PROMPTS[postType] 

  // Check: If it's a function, call it. If it's a string, use it as is.
  const postSpecificInstructions = typeof rawInstruction === "function"
    ? rawInstruction(postType === "Promotion / offer" ? promoType : eventType, customDetails)
    : rawInstruction;
  
  

  return `You are a Marketing Master. Put yourself in the shoes of the owner of "${business_name}", a local ${niche} at ${location}.
You are writing this post yourself — in your own voice, from your own experience on the ground.
You know your neighbours, your street, and your regulars by name.
Write as someone who genuinely lives and works in this community, not as a marketer.
One rule: even though you write from your own perspective, every sentence must still serve the reader — not just talk about yourself.

CONTEXT:
  Here are the LAST 3 posts generated for this business. 
  ATTENTION: AVoid the opening lines, hooks, or specific stories used in these posts:
  ---
  ${recentHistory}
  ---

TASK:

1. In ONE brief line, note the neighbourhood name around ${location}and 2-3 landmark names only and 2-3 trends in the neighberhood. No descriptions, no sentences — just names.
2. Write a NEW, fresh social media post using the ${framework} framework.
  -If the previous posts mentioned the waterfront, focus on a specific street or landmark instead.
  - Change the opening "hook" entirely.

STRICT OUTPUT FORMAT:
EXAMPLE FORMAT:
<research>Neighbourhood: Mimico. Landmarks: Amos Waites Park, Mimico GO Station, SanRemo Bakery. Local pulse: spring waterfront walks are back.</research>
Walking past the GO station this morning with a tray of fresh sourdough, I thought about how many of you grab that 7:42 train after stopping in... [rest of post]

SEASONALITY:
It is currently ${month}. Let the season and local mood shape the post — weather, community rhythm, what people are doing right now in this neighbourhood.

POST TYPE SPECIFIC RULES:
${postSpecificInstructions}

BRAND VOICE — ${voice}:
${VOICE_PROMPTS[voice] || "Warm, conversational, and community-first."}

FRAMEWORK — apply ${framework} exactly:
${FRAMEWORK_PROMPTS[framework] || FRAMEWORK_PROMPTS["PAS"]}

FORMAT RULES:
- Put ALL your research, neighbourhood name, and landmark notes inside <research></research>, provide ONLY the neighborhood name and 5 keywords. Max 20 words total. (e.g. <research>Mimico: GO Station, rainy, spring jackets</research>).
- STRICT RULE: Do not output word counts, meta-commentary, or feedback. After the <research> tag, output the social media post and NOTHING ELSE. If you do not finish the post, the output is a failure. 
- Write the actual social media post AFTER the closing </research> tag.
- Do NOT use structural labels like "Attention:", "Problem:", "Before:" in the post body.
- Write in first person ("I", "We").
- Keep it human, warm, and neighbourly.
- 130-180 words in the post body (not counting the <research> block)
- Short paragraphs, one blank line between each
- CRITICAL: Never stop writing mid-sentence. 
- LENGTH: You must exceed 130 words. 
- TERMINATION: If you reach your output limit, you MUST stop the current sentence and skip immediately to the hashtags. Do not leave a sentence hanging.
- COMPLETION: Every post must end with a clear punctuation or a hashtag.
- First sentence must contain a natural-language keyword a local would search on Instagram (e.g. "best sourdough in Mimico") — written as a statement, not a hashtag
- The call to action must emerge naturally from the story — not sit as a 
  separate closing sentence. It should feel like the next logical thought, 
  not an instruction. The reader should feel invited, not directed.
  Wrong: "Book your table tonight — link in bio."
  Right: "If your evening is still wide open, we have a table with your name on it."
- 3-4 hashtags on the final line: neighbourhood first, then niche, then broad
- Max 3 emojis — only if it adds meaning, never decoration
- Banned phrases: "After a day...", "Juggling...", "Finding a...", "a stone's throw", "pour our hearts", "passionate about", "quality service", "reach out", "don't hesitate", "we pride ourselves"`
;

}

// ─────────────────────────────────────────────
// 5. API ROUTE HANDLER
// ─────────────────────────────────────────────

export async function POST(req: Request) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return NextResponse.json({ error: "Missing API Key" }, { status: 500 });
  }

  try {
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
      customDetails = "" // <-- Make sure these are here
    } = await req.json();

    const { data: recentPosts } = await supabase
  .from("posts")
  .select("content")
  .eq("business_id", business_id)
  .neq("content", "EMPTY")           // filter out the EMPTY rows you have
  .order("created_at", { ascending: false })
  .limit(3);

      // --- ADD THIS DEBUG BLOCK ---
      // --- ADD THIS DEBUG BLOCK ---
      console.log("--- M8V MEMORY CHECK ---");
      if (recentPosts && recentPosts.length > 0) {
        console.log(`Found ${recentPosts.length} previous posts.`);
        recentPosts.forEach((p, i) => console.log(`Post ${i + 1}: ${p.content.substring(0, 50)}...`));
      } else {
        console.log("NO HISTORY FOUND. Generating from scratch.");
      }
      console.log("-----------------------");

  const recentHistory = recentPosts?.length
  ? recentPosts
      .map((p, i) => `- Post ${i + 1}: "${(p.content || "").slice(0, 300)}..."`)
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
      customDetails || "" // Argument 11
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

// 1. READ THE HIDDEN SWITCH (Check your .env.local for AI_PROVIDER)
const provider = process.env.AI_PROVIDER || "gemini"; 
let rawResponse = "";

try {
  if (provider === "groq") {
    console.log("--- M8V ENGINE: ROUTING TO GROQ (LLAMA 3) ---");
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: "You are a local marketing expert for Mimico." },
        { role: "user", content: finalPrompt }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
    });
    rawResponse = chatCompletion.choices[0]?.message?.content || "";
  } 
  else {
    console.log("--- M8V ENGINE: ROUTING TO GOOGLE GEMINI ---");
    // We'll keep the v1 stable config here
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }, { apiVersion: 'v1beta' });
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
let content: string;

if (rawResponse.includes("</research>")) {
  content = rawResponse.split("</research>")[1].trim();
} else if (rawResponse.includes("<research>")) {
  // If the tag was opened but never closed, take the last paragraph
  const parts = rawResponse.split(/\n\n+/);
  content = parts[parts.length - 1].trim();
} else {
  content = rawResponse.trim();
}

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