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
    const { prompt: category, niche, postType, voice, businessName } = await req.json();

    // Determine the framework
    const framework = getFramework(category, postType, voice);

    // COMBINED PROMPT: Framework Logic + Mimico Context
          const finalPrompt = `
      You are an marketing expert and social media manager for small businesses in Mimico, Toronto.
        Write a ${postType} social mediad post, for Instagram facebook ... for a business named "${businessName}".
        They are a ${niche} within the ${category} industry.
        
        CRITICAL INSTRUCTION: Use the ${framework} copywriting framework.
        - If PAS: Focus on Problem, Agitation, and Solution.
        - If BAB: Focus on Before, After, and Bridge.
        - If AIDA: Focus on Attention, Interest, Desire, and Action.

        Tone of voice: ${voice}.
        Include local Mimico references where appropriate.

        Niche Logic: If Niche is "Dentist", specifically mention "Patient Comfort" or "Booking a Checkup". If Niche is "Chiropractor", focus on "Alignment" and "Pain Relief".

        INSTAGRAM FORMATTING:
        - Double line breaks between paragraphs.
        - Address the specific niche at least once
        - 3 to 5 emojis total.
        - Exactly 3 hashtags: #Mimico #SouthEtobicoke and include name of the company as #Comnpany.
        - find a clever way to include a call for action and company name in the body of the text organicaly instead of at the end of the post.
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