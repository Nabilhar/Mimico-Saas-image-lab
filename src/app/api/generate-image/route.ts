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

    // ── PROVIDER 2: POLLINATIONS (download & upload) ───────────
    // Free, unlimited, reliable enough for MVP — host it in Supabase
    if (!hostedUrl) {

          ---------------------------------------------------------------*/

      try {
        console.log("Trying Pollinations download...");
        const pollinationsUrl = buildPollinationsUrl(cleanDescription);

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
          inputs: cleanDescription,
          provider: "hf-inference",
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