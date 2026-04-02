
import { 
  GoogleGenerativeAI, 
  HarmCategory, 
  HarmBlockThreshold 
} from "@google/generative-ai"; // Make sure these three are inside the { }
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
      business_name, 
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
You are a Marketing Master with all your expertise you put your self in the shoes of the owner of "${business_name}", a local ${niche} at ${location}.
  
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

              // for SIMULATION to (delete late)*****
              
              // ... the rest of your real GoogleGenerativeAI code (delete late)*****

    const genAI = new GoogleGenerativeAI(key);
    // Note: Using 'gemini-1.5-flash' for reliability, update if using 3-flash-preview
    const model = genAI.getGenerativeModel( 
      { model: "gemini-3-flash-preview" }, 
      { apiVersion: "v1beta" } // Gemini 3 requires the beta endpoint

     );

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: finalPrompt }] }],
      generationConfig: {
        temperature: 0.8,
        maxOutputTokens: 1000,
      }
    });

    const text = result.response.text().trim();

    return NextResponse.json({ content: text });

  } catch (error: any) {

    // This helps you see in VS Code if it's a 429 (Too Many Requests)
    console.error("API ROUTE ERROR:", error?.status || "General Error");
    
    if (error?.status === 429) {
      return NextResponse.json({ error: "Rate limit reached. Please wait 60 seconds." }, { status: 429 });
    }
    
    return NextResponse.json({ error: "Generation failed." }, { status: 500 });
  }
}