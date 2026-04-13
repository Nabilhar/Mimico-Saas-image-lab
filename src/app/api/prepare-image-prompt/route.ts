// MAIN HANDLER
// ─────────────────────────────────────────────
// app/api/generate-image/route.ts
// Image Chain: Gemini → Pollinations (hosted) → HuggingFace SDK → Pollinations (URL fallback)

import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";
import { NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';


const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const tools = [  { googleSearch: {},}, ] as any;

const gemmaModel = genAI.getGenerativeModel({ 
  model: "gemma-4-26b-a4b-it", 
  tools: tools // <--- INTEGRATING THE RESEARCH TOOL
}, { apiVersion: 'v1beta' });

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ARCHITECT_MODE: "GEMINI" | "GROQ" | "GEMMA" = "GEMMA";

const textModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash" }, { apiVersion: 'v1beta' });


export async function POST(req: Request) {

  const { postId, generatedPost, business_name, business_id, location, niche } = await req.json();
    try {
      if (!postId) throw new Error("No Post ID provided for architect.");

      const currentTime = new Date().toLocaleTimeString('en-US', { 
        hour: 'numeric', minute: '2-digit', hour12: true });

      const currentMonth = new Date().toLocaleString('default', { month: 'long' });

          // ── FETCH RECENT IMAGE PROMPTS ─────────────────────────
    const { data: recentPrompts } = await supabase
    .from("community_posts")
    .select("image_prompt")
    .eq("business_id", business_id)
    .neq("image_prompt", "EMPTY")
    .order("created_at", { ascending: false })
    .limit(5);

  const recentImageHistory = recentPrompts?.length
    ? recentPrompts
        .map((p, i) => {
          // Extract the first visual sentence — the subject line
          const firstSentence = (p.image_prompt || "").split(/[.]/)[0].trim();
          return `- Prompt ${i + 1}: "${firstSentence}"`;
        })
        .join("\n")
    : null;

  console.log("--- RECENT IMAGE PROMPTS ---");
  console.log(recentImageHistory || "No previous image prompts found.");
  console.log("----------------------------");
  
      // ── STEP A: ARCHITECT (text → visual description) ─────────
      const architectPrompt = `
          You are a prompt engineer for AI image generation, specializing in hyper-local 
          commercial and lifestyle photography.

              RECENT IMAGE PROMPTS — FORBIDDEN TERRITORY:
          ${recentImageHistory ? `These image prompts were already generated for this business. 
          You are FORBIDDEN from repeating these subjects, settings, or visual angles:
          ${recentImageHistory}
          
          Start from a completely different visual element:
          - If recent prompts showed food/drink → focus on the space, window, or street outside
          - If recent prompts showed the exterior → go inside, show texture, materials, details
          - If recent prompts showed the waterfront → show the warmth of the interior instead`
          : "No previous image prompts. Full creative freedom."}
        
          STEP 1 — RESEARCH (use Google Search):
          Search for "${business_name}" at "${location}".
          Find and note:
          - What does the Storefront look like?
          - Does this business have a patio, terrace, or outdoor seating?
          - Is there a water view, park, or landmark visible from the business?
          - What is the interior style — lighting, colours, materials, vibe?
          - What is their signature food, drink, or product?
          - Any distinctive visual details (signage, decor, uniforms, packaging)?
  
          If you cannot find specific results, use your knowledge of ${location} 
          and the neighbourhood context instead.
  
          STEP 2 — ANALYZE THE POST:
          Social media post to match:
          "${generatedPost}"
  
          Business: ${business_name} — ${niche}
          Location: ${location}
          Season / Time: ${currentMonth}, ${currentTime}
  
          STEP 3 — ENGINEER THE IMAGE PROMPT:
          Using what you found in Step 1 and the post mood from Step 2, write 
          a 3-5 sentence image generation prompt for FLUX.1-schnell.
  
          CRITICAL: always start the final image prompt with "*Final H Generation*".

          Structure it in this order:
          1. SUBJECT: The hero of the image — food, drink, storefront, product, 
            or scene. Use real details from your research (e.g. "a ceramic bowl 
            of poutine on a weathered wood table"). Never a person's face.
            if including a storefront, you MUST specify NO TEXT (name, phone, etc.).
            Instruct the model to use an extreme close-up on architectural details,
            a sharp side-profile angle, or a focus on the doorway greenery to naturally
            obscure or omit the main signage."
          2. SETTING: Reference the real physical space of this business — 
            patio with lake view, brick interior, waterfront neighbourhood, etc.
            Use what you found in Step 1.
          3. LIGHTING: Exact light quality for ${currentMonth} at ${currentTime} 
            in ${location} — golden hour, overcast spring light, warm indoor lamp, etc.
          4. MOOD: The emotion the viewer should feel, extracted from the post's tone.
          5. TECHNICAL: End every prompt with exactly this — 
            "Shot on Sony A7, f/1.8, shallow depth of field, 1:1 square crop, 
            no text, no watermark, no people, no faces"
  
          RULES:
          - Use concrete visual details from your research — not generic guesses
          - Never say "beautiful", "stunning", "amazing" — describe what you SEE
          - If the business has a patio with a lake view, put that in the setting
          - The image should feel like the owner took it on their best day
          - Output ONLY the final image prompt. No labels, no explanation, 
            no "Here is the prompt:", no preamble. Just the prompt text itself.
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
  
        const response = result.response;
  
      // Log what Gemma actually searched for
      const groundingMeta = (response as any).candidates?.[0]
        ?.groundingMetadata?.webSearchQueries;  
      if (groundingMeta) {
        console.log("--- GEMMA SEARCHED FOR ---");
        console.log(groundingMeta);}
  
        visualDescription = result.response.text();
      }

      const cleanDescription = visualDescription
      // 1. Remove everything from the start up until the last Technical block 
      // (This clears the Research, Business context, and Subject/Setting labels)
      .replace(/[\s\S]*\*Final H Generation\*/i, "")

      // 2. Remove specific internal labels if they still appear in the final paragraph
      .replace(/\*Subject:\*|\*Setting:\*|\*Lighting:\*|\*Mood:\*|\*Technical:\*/gi, "")
      
      // 3. Remove common "thinking" phrases or bulleted checks
      .replace(/\*Check.*?\*/gi, "")
      .replace(/\*Location Check:\*/gi, "")
      
      // 4. Remove any remaining bold markers or extra whitespace
      .replace(/\*\*/g, "")
      .replace(/\s+/g, ' ')
      .trim();
    
      
        // SAVE TO SUPABASE: Link the background-engineered prompt to the specific post
        const { error: rpcError } = await supabase.rpc('update_post_image_prompt', {
                post_id: postId,
                new_prompt: cleanDescription
            });
        
            if (rpcError) throw rpcError;

            console.log(`✅ Architect prompt cached for Post ${postId}`);
            return NextResponse.json({ success: true, cachedPrompt: cleanDescription });
        
          } catch (error: any) {
            console.error("Architect Engine Failed:", error.message);

            await supabase.rpc('update_post_image_prompt', {
              post_id: postId,
              new_prompt: `ERROR: ${error.message}`
          });
            
            return NextResponse.json({ error: error.message }, { status: 500 });
          }
        }