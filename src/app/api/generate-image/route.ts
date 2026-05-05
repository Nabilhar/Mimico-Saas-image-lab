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
    const { data: business, error: businessError  } = await supabase
      .from('businesses')
      .select('business_name, street, city, province_state, country, postal_code')
      .eq('user_id', userId) // <-- Changed from business_id
      .eq('is_active', true) // Only the active business
      .single();

    if (businessError || !business) {
      return NextResponse.json({ error: "Business profile not found." }, { status: 404 });
    }
    const fullAddress = `${business.street}, ${business.city}, ${business.province_state}, ${business.country} ${business.postal_code}`;
    const businessName = business.business_name;
 
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

      if (provider === "deepinfra") {
        console.log("--- Image ENGINE: DEEPINFRA (FLUX-2-pro) ---");
      
        const response = await fetch("https://api.deepinfra.com/v1/openai/images/generations", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.DEEPINFRA_API_KEY}`,
          },
          body: JSON.stringify({
            model: "black-forest-labs/FLUX-2-pro", // Model name goes inside the body for this endpoint
            prompt: prompt,
            n: 1,
            size: "1024x1024",
            response_format: "b64_json", // This ensures you get base64 back
          }),
          signal: AbortSignal.timeout(60000),
        });
      
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`DeepInfra image failed: ${response.status} - ${errorText}`);
        }
      
        const data = await response.json();
        
        // OpenAI format: data[0].b64_json
        const base64 = data.data?.[0]?.b64_json;
        
        if (!base64) throw new Error("DeepInfra returned no image data");
      
        const imageBuffer = Buffer.from(base64, "base64");
        const blob = new Blob([imageBuffer], { type: "image/png" });
        return await uploadToSupabase(blob, "DEEPINFRA");
      }

      if (provider === "openrouter") {
        console.log("--- Image ENGINE: OPENROUTER (FLUX.2 Pro) ---");
      
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
            "HTTP-Referer": "https://shorlinestudio.ca",
            "X-Title": "Shoreline",
          },
          body: JSON.stringify({
            model: "black-forest-labs/flux.2-pro", // note lowercase from their SDK
            messages: [{ role: "user", content: prompt }],
            modalities: ["image"],
          }),
          signal: AbortSignal.timeout(60000),
        });
      
        const raw = await response.text();
        console.log("--- OPENROUTER FLUX RAW RESPONSE:", raw);
      
        const data = JSON.parse(raw);
        console.log("--- OPENROUTER FLUX RAW RESPONSE LENGTH:", raw.length, "chars");
      
        // Extract image URL from their message.images structure
        const imageData = data.choices[0]?.message?.images?.[0]?.image_url?.url;
        if (!imageData) throw new Error("OpenRouter FLUX returned no image data");
        
        let blob: Blob;
        
        if (imageData.startsWith("data:")) {
          // Base64 response — decode directly
          const base64 = imageData.replace(/^data:image\/\w+;base64,/, "");
          const imageBuffer = Buffer.from(base64, "base64");
          blob = new Blob([imageBuffer], { type: "image/png" });
        } else {
          // URL response — fetch it
          const imageRes = await fetch(imageData);
          blob = await imageRes.blob();
        }
        return await uploadToSupabase(blob, "OPENROUTER_FLUX2PRO"); // ← was missing
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
      const fallbackChain = ["deepinfra", "openrouter", "huggingface", "cloudflare"];

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