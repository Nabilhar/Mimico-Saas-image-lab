// app/api/generate-image/route.ts
// Image Chain: Gemini → Pollinations (hosted) → HuggingFace SDK → Pollinations (URL fallback)

import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";
import { InferenceClient } from "@huggingface/inference";
import { NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';


const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const tools = [ {googleSearch: {},},] as any;

const hf = new InferenceClient(process.env.HF_TOKEN!);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);


const textModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash" }, { apiVersion: 'v1beta' });
const imageModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash-image" }, { apiVersion: 'v1beta' });

// Helper to wait if the background job is still running
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

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

export async function POST(req: Request) {
  try {
    // We now just need the ID to find the cached prompt
    const { postId, business_name, location } = await req.json();

    if (!postId) {
      return NextResponse.json({ error: "Missing post ID" }, { status: 400 });
    }
 
    const { data: post, error: dbError } = await supabase
        .from('community_posts')
        .select('image_prompt')
        .eq('id', postId)
        .single();
      
        if (dbError || !post) {
          console.error("Supabase Fetch Error:", dbError?.message);
          return NextResponse.json({ error: "Post not found in community_table" }, { status: 404 });
        }

        // 2. EVALUATE THE STATUS OF THE PROMPT
        const postPrompt = post.image_prompt;

        // Status: Still processing
        if (!postPrompt) {
          return NextResponse.json({ status: 'WAITING' }, { status: 202 });
        }

        // Status: Architect failed
    if (postPrompt.startsWith("ERROR:")) {
      return NextResponse.json({ 
        status: 'ERROR', 
        message: "Architect failed to build prompt" 
      }, { status: 500 });
    }


    const finalDescription = postPrompt 
    const cleanDescription = `Professional photography of ${finalDescription} for ${business_name} in ${location}.`;


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
          ---------------------------------------------------------------*/


        // ── PROVIDER : HUGGING FACE SDK ───────────────────────────
    // Uses your free monthly credits (~200-300 images/month on free tier)
    if (!hostedUrl) {
      try {
        console.log("Trying Hugging Face SDK...");
        const response: any = await hf.textToImage({
          model: "black-forest-labs/FLUX.1-schnell",
          inputs: cleanDescription,
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

    // ── PROVIDER 2: CLOUD FLARE SDK ───────────────────────────
    // Uses your free monthly credits (~100-300 images/month on free tier)
    if (!hostedUrl) {
      try {
          console.log("Trying Cloudflare Workers AI (SDXL)...");
          // *** MODEL ID CHANGED TO SDXL ***
          const cloudflareApiUrl = `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/ai/run/@cf/stabilityai/stable-diffusion-xl-base-1.0`;

          const response = await fetch(cloudflareApiUrl, {
              method: "POST",
              headers: {
                  "Authorization": `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
                  "Content-Type": "application/json",
              },
              body: JSON.stringify({
                  prompt: cleanDescription,
                  num_inference_steps: 25, // Good range for SDXL (typically 20-50)
                  guidance_scale: 7.5,    // Standard for SDXL
                  // SDXL on Cloudflare typically returns a PNG by default, no need for output_format
              }),
              signal: AbortSignal.timeout(60000), // SDXL can take up to 60s
          });

          if (!response.ok) {
              const errorText = await response.text();
              console.error(`Cloudflare AI (SDXL) failed response: ${errorText}`); // Log full error
              throw new Error(`Cloudflare AI fetch failed (SDXL): ${response.status} - ${errorText}`);
          }

          // Cloudflare's SDXL model typically returns the image directly as a binary blob
          const rawBlob = await response.blob();
          const blob = new Blob([rawBlob], { type: 'image/png' });
          hostedUrl = await uploadToSupabase(blob, "CLOUDFLARE_SDXL");
          if (hostedUrl) finalProvider = "CLOUDFLARE_SDXL";
          else console.warn("Cloudflare AI (SDXL) succeeded but Supabase upload failed");

      } catch (e) {
          console.warn("Cloudflare Workers AI (SDXL) failed:", e);
      }
     }

    // ── 3 LAST RESORT: POLLINATIONS URL (not hosted) ─────────────
    // Image loads in browser but won't persist reliably in library
    if (!hostedUrl) {
      console.error("❌ All hosted providers failed. Returning Pollinations URL directly.");
      const pollinationsUrl = buildPollinationsUrl(cleanDescription);
      return NextResponse.json({
        url: pollinationsUrl,
        debugPrompt: cleanDescription,
        providerUsed: 'POLLINATIONS_UNHOSTED',
        hosted: false,
      });
    }

    // ── SUCCESS ────────────────────────────────────────────────
    return NextResponse.json({
      url: hostedUrl,
      debugPrompt: cleanDescription,
      providerUsed: finalProvider,
      hosted: true,
    });

  } catch (error: any) {
    console.error("Image Chain Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}