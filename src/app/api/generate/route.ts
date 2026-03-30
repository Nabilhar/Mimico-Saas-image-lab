import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

// 1. DATA MAPS (Keep these outside the function so they don't re-run)
const BUSINESS_ARCHETYPES: Record<string, string> = {
  "Health & Wellness": "pain-driven",
  "Home Services": "pain-driven",
  "Automotive": "pain-driven",
  "Trades & Industrial": "pain-driven",
  "Food & Beverage": "lifestyle",
  "Beauty & Personal Care": "lifestyle",
  "Fitness & Recreation": "lifestyle",
  "Retail": "lifestyle",
  "Pets": "lifestyle",
  "Events & Hospitality": "lifestyle",
  "Professional Services": "considered-purchase",
  "Real Estate & Property": "considered-purchase",
  "Education & Childcare": "considered-purchase",
  "Technology": "considered-purchase",
};

// 2. THE LOGIC ENGINE
function getFramework(category: string, postType: string, voice: string) {
  if (postType === "Myth-busting") return "PAS";
  if (postType === "Behind the scenes") return "BAB";
  if (voice === "The Hustler") return "PAS";

  const archetype = (BUSINESS_ARCHETYPES[category] || "lifestyle") as "pain-driven" | "lifestyle" | "considered-purchase";
  
  const matrix: Record<string, Record<string, string>> = {
    "5 Tips": { "pain-driven": "PAS", "lifestyle": "BAB", "considered-purchase": "AIDA" },
    "Promotion / offer": { "pain-driven": "PAS", "lifestyle": "BAB", "considered-purchase": "AIDA" },
    "Local event / news": { "pain-driven": "PAS", "lifestyle": "BAB", "considered-purchase": "AIDA" },
  };

  return matrix[postType]?.[archetype] || "PAS";
}

// 3. THE SINGLE POST HANDLER
export async function POST(req: Request) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return NextResponse.json({ error: "Missing API Key" }, { status: 500 });
  }

  try {
    // Extract everything from the dashboard/profile
    const { prompt: userTopic, category, postType, voice, businessName } = await req.json();

    // Determine the framework
    const framework = getFramework(category, postType, voice);

    const frameworkInstructions: Record<string, string> = {
      PAS: "Structure: 1. Problem (Identify a local pain point). 2. Agitation (Explain why it hurts/matters). 3. Solution (Introduce the business as the hero).", 
      BAB: "Structure: 1. Before (The current relatable struggle). 2. After (The aspirational result). 3. Bridge (How this business makes the change happen).", 
      AIDA: "Structure: 1. Attention (Bold hook). 2. Interest (Local relevance). 3. Desire (The benefits). 4. Action (The clear next step).",
    };

    // COMBINED PROMPT: Framework Logic + Mimico Context
    const finalPrompt = `
      You are a local marketing expert for the Mimico/M8V area of Toronto. 
      Business: ${businessName} (${category})
      Tone: ${voice}
      Topic: ${userTopic}

      COPYWRITING FRAMEWORK: ${framework}
      ${frameworkInstructions[framework]}

      MIMICO CONTEXT (March 2026):
      - Mention the Mimico GO Station revitalization if relevant.
      - Reference the Waterfront Trail or Humber Bay Park West.
      - Community touchpoints: SanRemo Bakery (busy/fritters) or Royal York Meat Market.
      - Vibe: "Beach of the West End" / Neighborly pride.

      INSTAGRAM FORMATTING:
      - Double line breaks between paragraphs.
      - 3 to 5 emojis total.
      - Exactly 3 hashtags: #Mimico #SouthEtobicoke #ShopLocalTO.
      - If "5 Tips", use numbered list 1-5.
    `;

    const genAI = new GoogleGenerativeAI(key);
    // Note: Using 'gemini-1.5-flash' for reliability, update if using 3-flash-preview
    const model = genAI.getGenerativeModel({ 
        model: "gemini-3-flash-preview",
        
    });

    const result = await model.generateContent(finalPrompt);
    const text = result.response.text().trim();

    return NextResponse.json({ content: text });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to generate content." }, { status: 500 });
  }
}