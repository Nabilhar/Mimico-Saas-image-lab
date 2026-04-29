// app/api/generate-image/route.ts
// Image Chain: Gemini → Pollinations (hosted) → HuggingFace SDK → Pollinations (URL fallback)

import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";
import { InferenceClient } from "@huggingface/inference";
import { NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';
import { auth } from "@clerk/nextjs/server";

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
  // 1. Get Secure ID
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 2. Remove business_id from destructuring
    const { postId } = await req.json();

    if (!postId) {
      return NextResponse.json({ error: "Missing post ID" }, { status: 400 });
    }

    // 3. Update Profile Query to use userId
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('business_name, street, city, province_state, country, postal_code')
      .eq('id', userId) // <-- Changed from business_id
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "Business profile not found." }, { status: 404 });
    }
    const fullAddress = `${profile.street}, ${profile.city}, ${profile.province_state}, ${profile.country} ${profile.postal_code}`;
    const businessName = profile.business_name;
 
    const { data: post, error: dbError } = await supabase
        .from('community_posts')
        .select('image_prompt')
        .eq('id', postId)
        .eq('business_id', userId)
        .single();
      
        if (dbError || !post) {
          console.error(`❌ Supabase Error: Could not find post with ID ${postId}`);
          return NextResponse.json({ status: 'WAITING' }, { status: 202 });
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
    const cleanDescription = `Professional photography of ${finalDescription} for  ${businessName} in ${fullAddress}.`;

    const IMAGE_ENGINE_MODE = process.env.IMAGE_ENGINE_MODE || "FALLBACK";

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


    // ─────────────────────────────────────────────────────────────────────────────
    // IMAGE PROVIDER CALLER
    // ─────────────────────────────────────────────────────────────────────────────
    async function callImageProvider(provider: string, prompt: string): Promise<string | null> {

      if (provider === "huggingface") {
        console.log("--- Image ENGINE: HUGGING FACE (FLUX.1-schnell) ---");
        const response: any = await hf.textToImage({
          model: "black-forest-labs/FLUX.1-schnell",
          inputs: prompt,
          parameters: { num_inference_steps: 4 },
        });
        const blob = typeof response === 'string'
          ? await fetch(response).then(r => r.blob())
          : response;
        return await uploadToSupabase(blob, "HUGGING_FACE");
      }

      if (provider === "cloudflare") {
        console.log("--- Image ENGINE: CLOUDFLARE (SDXL) ---");
        const cloudflareApiUrl = `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/ai/run/@cf/stabilityai/stable-diffusion-xl-base-1.0`;
        const response = await fetch(cloudflareApiUrl, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prompt,
            num_inference_steps: 25,
            guidance_scale: 7.5,
          }),
          signal: AbortSignal.timeout(60000),
        });
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Cloudflare failed: ${response.status} - ${errorText}`);
        }
        const rawBlob = await response.blob();
        const blob = new Blob([rawBlob], { type: 'image/png' });
        return await uploadToSupabase(blob, "CLOUDFLARE_SDXL");
      }

      if (provider === "pollinations") {
        console.log("--- Image ENGINE: POLLINATIONS (unhosted fallback) ---");
        return buildPollinationsUrl(prompt); // returns URL directly, not uploaded
      }

      throw new Error(`Unsupported image provider: ${provider}`);
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // THE ROUTER
    // ─────────────────────────────────────────────────────────────────────────────
    if (IMAGE_ENGINE_MODE === "TOGGLE") {
      // DEV MODE: Use exactly what IMAGE_PROVIDER env var says
      const providerToUse = process.env.IMAGE_PROVIDER || "huggingface";
      console.log(`--- Image MODE: TOGGLE [Using ${providerToUse}] ---`);
      try {
        const result = await callImageProvider(providerToUse, cleanDescription);
        if (result) {
          hostedUrl = result;
          finalProvider = providerToUse.toUpperCase();
        }
      } catch (e) {
        console.error(`TOGGLE provider ${providerToUse} failed:`, e);
      }

    } else {
      // PROD MODE: Fallback chain
      console.log("--- Image MODE: FALLBACK CHAIN ---");
      const fallbackChain = ["huggingface", "cloudflare"];

      for (const provider of fallbackChain) {
        try {
          const result = await callImageProvider(provider, cleanDescription);
          if (result) {
            hostedUrl = result;
            finalProvider = provider.toUpperCase();
            break;
          }
        } catch (e) {
          console.warn(`Image provider ${provider} failed. Moving to next...`);
        }
      }
    }

    // ── LAST RESORT: POLLINATIONS (unhosted) ──────────────────────────────────
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

    // ── SUCCESS ────────────────────────────────────────────────────────────────
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