// app/api/generate-image/route.ts
// Image Chain: Gemini → Pollinations (hosted) → HuggingFace SDK → Pollinations (URL fallback)

import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";
import { InferenceClient } from "@huggingface/inference";
import { NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';


const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const tools = [
  {
    googleSearch: {}, // Use 'googleSearch' for the latest 2026 models
  },
] as any;

const gemmaModel = genAI.getGenerativeModel({ 
  model: "gemma-4-26b-a4b-it", 
  tools: tools // <--- INTEGRATING THE RESEARCH TOOL
}, { apiVersion: 'v1beta' });

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });
const hf = new InferenceClient(process.env.HF_TOKEN!);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Toggle between GEMINI and GROQ for the Architect (text) step
// Set to "GROQ" when Gemini hits 429
const ARCHITECT_MODE: "GEMINI" | "GROQ" | "GEMMA" = "GEMMA";

const textModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash" }, { apiVersion: 'v1beta' });
const imageModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash-image" }, { apiVersion: 'v1beta' });

// ─────────────────────────────────────────────
// HELPER: Upload a blob to Supabase Storage
// Returns the permanent public URL or null on failure
// ─────────────────────────────────────────────
async function uploadToSupabase(blob: Blob, provider: string): Promise<string | null> {
  try {
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.png`;
    const { error } = await supabase.storage
      .from('post-images')
      .upload(fileName, blob, { contentType: blob.type || 'image/png', upsert: true });

    if (error) {
      console.error(`Supabase upload error (${provider}):`, error.message);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from('post-images')
      .getPublicUrl(fileName);

    console.log(`✅ Uploaded to Supabase via ${provider}:`, urlData.publicUrl);
    return urlData.publicUrl;
  } catch (e) {
    console.error(`Supabase upload exception (${provider}):`, e);
    return null;
  }
}

// ─────────────────────────────────────────────
// HELPER: Build Pollinations URL from description
// ─────────────────────────────────────────────
function buildPollinationsUrl(visualDescription: string): string {
  const seed = Math.floor(Math.random() * 1000000);
  const clean = visualDescription
    .replace(/[^a-zA-Z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .slice(0, 200)
    .trim();
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(clean)}?width=1024&height=1024&nologo=true&seed=${seed}&model=flux`;
}

// ─────────────────────────────────────────────
// MAIN HANDLER
// ─────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const { generatedPost, business_name, location, niche } = await req.json();
    const currentTime = new Date().toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit', 
      hour12: true 
    });
    const currentMonth = new Date().toLocaleString('default', { month: 'long' });

    // ── STEP A: ARCHITECT (text → visual description) ─────────
    const architectPrompt = `
      You are a prompt engineer specializing in hyper-local commercial and lifestyle photography for AI image models.

      Analyze this social media post and extract the visual essence:
      "${generatedPost}"

      CONTEXT:
      - Business: ${business_name} — ${niche}
      - Location: ${location}
      - Season / Time: ${currentMonth}, ${currentTime}

      YOUR TASK:
      Write an image generation prompt (3-5 sentences) that will produce a stunning, hyper-local lifestyle photo matching the mood and story of this post.

      STRUCTURE YOUR PROMPT IN THIS ORDER:
      1. SUBJECT: What is the hero of the image? (food, drink, storefront, product, scene — never a person's face)
      2. SETTING: Where is it set? Reference the specific neighbourhood feel of ${location}
      3. LIGHTING: Describe the exact light quality matching ${currentMonth} and ${currentTime}
      4. MOOD: What emotion should the viewer feel? Extract this from the post's tone
      5. TECHNICAL: End with — "Shot on Sony A7, f/1.8, shallow depth of field, 1:1 square crop, no text, no watermark, no people"

      RULES:
      - Never mention faces, people, text overlays, logos, or watermarks
      - Never use abstract words like "beautiful" or "stunning" — describe what you SEE
      - Ground every detail in the physical reality of ${location} — mention the season, the light, the textures
      - The image must feel like it was taken by the business owner on a good day, not by a commercial photographer
      - Output ONLY the image prompt. No explanation, no preamble, no labels.
    `;

    let visualDescription = "";

    if (ARCHITECT_MODE === "GEMINI") {
      const result = await textModel.generateContent(architectPrompt);
      visualDescription = result.response.text();
    } else if (ARCHITECT_MODE === "GROQ") {
      const result = await groq.chat.completions.create({
        messages: [{ role: "user", content: architectPrompt }],
        model: "llama-3.1-8b-instant",
      });
      visualDescription = result.choices[0]?.message?.content || "";
    } else if (ARCHITECT_MODE === "GEMMA") {
      console.log("M8V Architect: Requesting Gemma 4 via Google AI SDK...");
      // Routing to Gemma 4 via Hugging Face Inference
      const result = await gemmaModel.generateContent(architectPrompt);
      visualDescription = result.response.text();
    }

    const cleanDescription = visualDescription.replace(/<[^>]*>/g, "").replace(/\s+/g, ' ').trim();
    const finalImagePrompt = `Professional photography of ${cleanDescription}. For a local business named "${business_name}" in ${location}. Style: cinematic natural light, shallow depth of field, 4k, perfect for a 1:1 Instagram square post.`;

    console.log("Architect output:", cleanDescription);

    let hostedUrl: string | null = null;
    let finalProvider = "UNKNOWN";

    /*---------------------------TRY AGAIN WHEN GEMINI LIMITS RESET--------------------------------------

    // ── PROVIDER 1: GEMINI IMAGE ───────────────────────────────
    try {
      console.log("Trying Gemini image...");
      const imageResult = await imageModel.generateContent(finalImagePrompt);
      const rawUrl = imageResult.response.text().trim();
      const urlMatch = rawUrl.match(/https?:\/\/[^\s]+/);
      const geminiUrl = urlMatch ? urlMatch[0] : rawUrl;

      const res = await fetch(geminiUrl);
      if (!res.ok) throw new Error(`Gemini URL fetch failed: ${res.status}`);

      const blob = await res.blob();
      hostedUrl = await uploadToSupabase(blob, "GEMINI");
      if (hostedUrl) finalProvider = "GEMINI";

    } catch (e) {
      console.warn("Gemini image failed:", e);
    }

    // ── PROVIDER 2: POLLINATIONS (download & upload) ───────────
    // Free, unlimited, reliable enough for MVP — host it in Supabase
    if (!hostedUrl) {

          ---------------------------------------------------------------*/

      try {
        console.log("Trying Pollinations download...");
        const pollinationsUrl = buildPollinationsUrl(visualDescription);

        const res = await fetch(pollinationsUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Referer': 'https://pollinations.ai/',
            'Accept': 'image/png,image/*,*/*',
          },
          // Give Pollinations up to 30s to generate
          signal: AbortSignal.timeout(30000),
        });

        if (!res.ok) throw new Error(`Pollinations fetch failed: ${res.status}`);

        const contentType = res.headers.get('content-type') || '';
        if (!contentType.includes('image')) {
          throw new Error(`Pollinations returned non-image content: ${contentType}`);
        }

        const blob = await res.blob();
        hostedUrl = await uploadToSupabase(blob, "POLLINATIONS");
        if (hostedUrl) finalProvider = "POLLINATIONS";

      } catch (e) {
        console.warn("Pollinations download failed:", e);
      }

    // ── PROVIDER 3: HUGGING FACE SDK ───────────────────────────
    // Uses your free monthly credits (~200-300 images/month on free tier)
    if (!hostedUrl) {
      try {
        console.log("Trying Hugging Face SDK...");
        const response: any = await hf.textToImage({
          model: "black-forest-labs/FLUX.1-schnell",
          inputs: finalImagePrompt,
          parameters: {
            num_inference_steps: 4,
          },
        });

        let finalBlob: Blob;

        // If HF returned a string (URL or Base64), fetch it into a Blob
        if (typeof response === 'string') {
          console.log("HF returned a string/URL, converting to blob...");
          const res = await fetch(response);
          finalBlob = await res.blob();
        } else {
          finalBlob = response;
        }

        hostedUrl = await uploadToSupabase(finalBlob, "HUGGING_FACE");
        if (hostedUrl) finalProvider = "HUGGING_FACE";
        else console.warn("HF succeeded but Supabase upload failed");

      } catch (e) {
        console.warn("Hugging Face SDK failed:", e);
      }
    }

    // ── LAST RESORT: POLLINATIONS URL (not hosted) ─────────────
    // Image loads in browser but won't persist reliably in library
    if (!hostedUrl) {
      console.error("❌ All hosted providers failed. Returning Pollinations URL directly.");
      const pollinationsUrl = buildPollinationsUrl(visualDescription);
      return NextResponse.json({
        url: pollinationsUrl,
        debugPrompt: visualDescription,
        providerUsed: 'POLLINATIONS_UNHOSTED',
        hosted: false,
      });
    }

    // ── SUCCESS ────────────────────────────────────────────────
    return NextResponse.json({
      url: hostedUrl,
      debugPrompt: visualDescription,
      providerUsed: finalProvider,
      hosted: true,
    });

  } catch (error: any) {
    console.error("Image Chain Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}