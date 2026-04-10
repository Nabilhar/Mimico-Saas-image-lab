import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";
import { NextResponse } from "next/server";
import { sanitizeForUrl } from '@/lib/utils';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });

// --- THE TOGGLE ---
// Change this to "GROQ" when Gemini hits a 429 error
const ARCHITECT_MODE: "GEMINI" | "GROQ" = "GROQ";

// We use Flash for the "Architect" and Flash-Image for the "Artist"
const textModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
const imageModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash-image" });

export async function POST(req: Request) {
  try {
    const { generatedPost, business_name, location } = await req.json();

    // --- STEP A: THE HIDDEN ARCHITECT ---
    // We ask Gemini to turn the social post into a visual masterpiece
    const architectPrompt = `
      You are a world-class commercial photographer. 
      Analyze this social media post: "${generatedPost}"
      Based on this post, write a 1-sentence visual description for a professional photo.
      RULES:
      - Focus on lighting, textures, and composition.
      - Keep it grounded in ${location}.
      - Do not mention text, emojis, or people's faces.
      - Style: High-end smartphone photography, natural vibes.
    `;

    let visualDescription = "";

    // --- STEP A: THE DYNAMIC ARCHITECT ---
    if (ARCHITECT_MODE === "GEMINI") {
      const architectResult = await textModel.generateContent(architectPrompt);
      visualDescription = architectResult.response.text();
    } else {
      const groqResult = await groq.chat.completions.create({
        messages: [{ role: "user", content: architectPrompt }],
        model: "llama-3.1-8b-instant", // Fast & efficient for architecting
      });
      visualDescription = groqResult.choices[0]?.message?.content || "";
    }

    // --- STEP B: THE IMAGE ARTIST ---
    // Now we feed that fresh description into Nano Banana 2
    const cleanDescription = visualDescription.replace(/\s+/g, ' ').trim();
    const finalImagePrompt = ` Professional photography of ${cleanDescription}. for a local business named "${business_name}" in ${location}. Style Cinematic natural light, shallow depth of field, 4k, perfect for a 1:1 Instagram. `;

    let imageUrl = "";
    let finalProvider = "GEMINI";

      try {
        // Attempt 1: Try Nano Banana
        const imageResult = await imageModel.generateContent(finalImagePrompt);
        let rawUrl = imageResult.response.text().trim(); 

        // Instead of full sanitization, just extract the URL if Gemini added text
        // This regex looks for anything starting with http and takes only that part
        const urlMatch = rawUrl.match(/https?:\/\/[^\s]+/);
        
        if (urlMatch) {
          imageUrl = urlMatch[0]; // This keeps the : and // perfectly intact!
        } else {
          imageUrl = rawUrl; // Fallback
        }

    } catch (imageError: any) {
      // Attempt 2: Fallback to Pollinations if Gemini is over quota (429)
      console.warn("Gemini Image Limit Hit, falling back to Pollinations...");
      
      const seed = Math.floor(Math.random() * 1000000);
      const cleanFinalPrompt = sanitizeForUrl(finalImagePrompt);  
      const encoded = encodeURIComponent(cleanFinalPrompt);
      
      // Using Flux-pro via Pollinations for high quality
      imageUrl = `https://image.pollinations.ai/prompt/${encoded}?width=1024&height=1024&nologo=true&seed=${seed}&model=flux`;
      finalProvider = "POLLINATIONS";
    }

    return NextResponse.json({ 
      url: imageUrl,
      debugPrompt: visualDescription,
      providerUsed: finalProvider
    });

  } catch (error: any) {
    console.error("Image Chain Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}