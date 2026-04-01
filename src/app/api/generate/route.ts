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
    const { 
      businessName, 
      category, 
      niche, 
      voice, 
      postType, 
      location, 
      framework,             // "PAS", "BAB", or "AIDA"
      frameworkInstructions: instructions  // The definition from FRAMEWORK_DEFINITIONS
    } = await req.json();

    // COMBINED PROMPT: Framework Logic + Mimico Context
    const finalPrompt = `
You are a Marketing Master with all your expertise you put your self in the shoes of the owner of "${businessName}", a local ${niche} at ${location}.
  
  TASK:
  1. Research the neighborhood for the address provided. Find 3 landmarks and trends specific to the neighberhood.
  2. Write a social media post using the ${framework} framework.

  STRICT OUTPUT FORMAT:
  - Put all your research, neighborhood names, and landmarks inside <research></research> tags.
  - Write the actual social media post AFTER the closing </research> tag.
  - DO NOT use labels like "Attention:" or "Problem:". 
  - Write in the FIRST PERSON ("I", "We"). 
  - Keep it human and neighborly.

  EXAMPLE:
  <research>Neighborhood: Mimico. Landmarks: Sanremo, Mimico GO.</research>
  I was just walking past the GO station this morning and realized... [rest of post]
    
    GUIDELINES:
    - Naturally mention one of the discovered landmarks from ${location} to prove local presence and build trust.
    - If the location is in Toronto (like Mimico, Etobicoke, or Liberty Village), ensure the tone reflects the specific vibe of that neighborhood.
    - Do not use generic placeholders like [Insert Landmark]; use real data from your research.
    - Focus on driving engagement and local relevance.
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