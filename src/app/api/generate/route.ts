// app/api/generate/route.ts
// M8V Engine — Hyper-Local Social Post Generator

import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from "@google/generative-ai";
import { getFramework, Framework } from "@/lib/frameworks";
import { NextResponse } from "next/server";

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
  month: string
): string {
  return `You are a Marketing Master. Put yourself in the shoes of the owner of "${business_name}", a local ${niche} at ${location}.
You are writing this post yourself — in your own voice, from your own experience on the ground.
You know your neighbours, your street, and your regulars by name.
Write as someone who genuinely lives and works in this community, not as a marketer.
One rule: even though you write from your own perspective, every sentence must still serve the reader — not just talk about yourself.

TASK:
1. In ONE brief line, note the neighbourhood name around ${location}and 2-3 landmark names only. No descriptions, no sentences — just names.
2. Write a social media post using the ${framework} framework.

STRICT OUTPUT FORMAT:
- Put ALL your research, neighbourhood name, and landmark notes inside <research></research> tags.
- Write the actual social media post AFTER the closing </research> tag.
- Do NOT use structural labels like "Attention:", "Problem:", "Before:" in the post body.
- Write in first person ("I", "We").
- Keep it human, warm, and neighbourly.

EXAMPLE FORMAT:
<research>Neighbourhood: Mimico. Landmarks: Amos Waites Park, Mimico GO Station, SanRemo Bakery. Local pulse: spring waterfront walks are back.</research>
Walking past the GO station this morning with a tray of fresh sourdough, I thought about how many of you grab that 7:42 train after stopping in... [rest of post]

SEASONALITY:
It is currently ${month}. Let the season and local mood shape the post — weather, community rhythm, what people are doing right now in this neighbourhood.

POST TYPE: ${postType}

BRAND VOICE — ${voice}:
${VOICE_PROMPTS[voice] || "Warm, conversational, and community-first."}

FRAMEWORK — apply ${framework} exactly:
${FRAMEWORK_PROMPTS[framework] || FRAMEWORK_PROMPTS["PAS"]}

FORMAT RULES:
- 80-160 words in the post body (not counting the <research> block)
- Short paragraphs, one blank line between each
- First sentence must contain a natural-language keyword a local would search on Instagram (e.g. "best sourdough in Mimico") — written as a statement, not a hashtag
- The call to action must emerge naturally from the story — not sit as a 
  separate closing sentence. It should feel like the next logical thought, 
  not an instruction. The reader should feel invited, not directed.
  Wrong: "Book your table tonight — link in bio."
  Right: "If your evening is still wide open, we have a table with your name on it."
- 3-4 hashtags on the final line: neighbourhood first, then niche, then broad
- Max 3 emojis — only if it adds meaning, never decoration
- Banned phrases: "a stone's throw", "pour our hearts", "passionate about", "quality service", "reach out", "don't hesitate", "we pride ourselves"`
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
      category,
      niche,
      voice,
      postType,
      location,
    } = await req.json();

    // Auto-select framework — user never has to choose
    const framework = getFramework(category, postType, voice);

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
      month
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

    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel(
      { model: "gemini-2.5-flash" },
      { apiVersion: "v1beta" }
    );

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: finalPrompt }] }],
      generationConfig: {
        temperature: 0.8,
        maxOutputTokens: 2500,
      },
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT,        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,       threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      ],
    });

    const rawText = result.response.text().trim();

    console.log("--- RAW RESPONSE ---");
    console.log(rawText);
    console.log("--- END RAW ---");

    let content: string;

    // Strip the <research> block — AI thinks out loud, user sees only the post
    if (rawText.includes("</research>")) {
      // Normal case — strip the research block cleanly
      content = rawText
        .replace(/<research>[\s\S]*?<\/research>/g, "")
        .trim();
    } else if (rawText.includes("<research>")) {
      // Truncated — research tag never closed, find the last blank line
      // and take everything after it as the post
      const parts = rawText.split(/\n\n+/);
      content = parts[parts.length - 1].trim();
    } else {
      // No tags at all — use the full response
      content = rawText;
    }

    console.log("--- STRIPPED CONTENT ---");
    console.log(content);
    console.log("--- END STRIPPED ---");

    return NextResponse.json({ content, framework });

  } catch (error: any) {
    console.error("API ROUTE ERROR:", error?.status || "General Error");

    if (error?.status === 429) {
      return NextResponse.json(
        { error: "Rate limit reached. Please wait 60 seconds." },
        { status: 429 }
      );
    }

    return NextResponse.json({ error: "Generation failed." }, { status: 500 });
  }
}