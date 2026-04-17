// MAIN HANDLER
// ─────────────────────────────────────────────
// app/api/generate-image/route.ts
// Image Chain: Gemini → Pollinations (hosted) → HuggingFace SDK → Pollinations (URL fallback)

import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";
import { NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';
import { getBrandIdentity } from "@/lib/brandDiscovery";
import { ColorTheme, BusinessVisuals } from '@/lib/constants';


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
  let postId = "";
  let generatedPost = "";
  let business_name = "";
  let business_id = "";
  let location = "";
  let niche = "";

  try {
    const body = await req.json();
    postId = body.postId;
    generatedPost = body.generatedPost;
    business_name = body.business_name;
    business_id = body.business_id;
    location = body.location;
    niche = body.niche;

    if (!postId || !business_id) {
      return NextResponse.json({ error: "Missing Post ID or Business ID" }, { status: 400 });
    }


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

      // 2. FETCH BRAND IDENTITY (The "Fast Path")
      const brandIdentity = await getBrandIdentity(business_id);
        
      const currentTime = new Date().toLocaleTimeString('en-US', { 
        hour: 'numeric', minute: '2-digit', hour12: true });

      const currentMonth = new Date().toLocaleString('default', { month: 'long' });
  
      // ── STEP A: ARCHITECT (text → visual description) ─────────
      const architectPrompt = `
        You are a prompt engineer for AI image generation, specializing in hyper-local commercial and lifestyle photography.
        RECENT IMAGE PROMPTS — FORBIDDEN TERRITORY:
        ${recentImageHistory ? `These image prompts were already generated for this business.
        You are FORBIDDEN from repeating these subjects, settings, or visual angles:
        ${recentImageHistory}
        Start from a completely different visual element:

        If recent prompts showed food/drink → focus on the space, window, or street outside
        If recent prompts showed the exterior → go inside, show texture, materials, details
        If recent prompts showed the waterfront → show the warmth of the interior instead`

        : "No previous image prompts. Full creative freedom."}

        STEP 1 — RESEARCH (use Google Search):Search for "${business_name}" at "${location}".
        Find and note:

        What does the storefront look like?
        Does this business have a patio, terrace, or outdoor seating?
        Is there a water view, park, or landmark visible from the business?
        What is the interior style — lighting, colours, materials, vibe?
        What is their signature food, drink, or product?
        Any distinctive visual details (signage, decor, uniforms, packaging)?

        If you cannot find specific results, use your knowledge of ${location} and the neighbourhood context instead.

        STEP 2 — ANALYZE THE POST:
        Social media post to match:
        "${generatedPost}"
        Business: ${business_name} — ${niche}
        Location: ${location}
        Season / Time: ${currentMonth}, ${currentTime}

        // --- BRANDING INJECTION (The Mood Anchor) ---
        ${brandIdentity.color_theme ? `BRAND MOOD & COLOR PSYCHOLOGY:
        The brand's visual identity is defined by: "${brandIdentity.color_theme.description}".
        CRITICAL: Use this palette to guide your vocabulary. If the palette is sophisticated/dark, use elegant and authoritative language. If it is bright/vibrant, use energetic and punchy language. Let the "vibe" of the colors shape your word choice.` : ""}

        ${brandIdentity.business_visuals ? `BRAND VISUAL DETAILS:
        - Logo: ${brandIdentity.business_visuals.logoColors}
        - Storefront: ${brandIdentity.business_visuals.storefrontColors}
        - Interior: ${brandIdentity.business_visuals.interiorColors}` : ""}

        STEP 3 — ENGINEER THE IMAGE PROMPT:
        Using what you found in Step 1 and the post mood from Step 2, write a 5 sentence image generation prompt for FLUX.1-schnell.
        Structure it in this order:
        1. COMPOSITION: Internalize one composition type that differs from any recent prompts — do not declare it in the output, only apply it:

        Wide environmental (full space, context, atmosphere)
        Medium scene (table-level, counter, patio)
        Detail close-up (texture, ingredient, material)

        2. SUBJECT: The hero of the image — food, drink, storefront, product, or scene. Use real details from your research (e.g. "a ceramic bowl of poutine on a weathered wood table"). No legible faces.
        If the scene includes signage or business name, handle it through one of these strategies — vary based on what hasn't appeared recently:

        (a) Wide angle with shallow depth of field — sign present but softly bokeh'd in background
        (b) Angle displacement — shoot from side or below so signage falls partially out of frame
        (c) Foreground occlusion — a plant, glass, or object partially blocks the sign organically

        Never default to extreme close-up solely to avoid text.
        If people are included, they are secondary to the environment — they animate the space but never dominate the frame. Their presence should feel like a candid moment, not a staged shot.
        3. SETTING: Reference the real physical space of this business — patio with lake view, brick interior, waterfront neighbourhood, etc. Use what you found in Step 1.
        4. LIGHTING: Exact light quality for ${currentMonth} at ${currentTime} in ${location} — golden hour, overcast spring light, warm indoor lamp, etc.
        5. MOOD: The emotion the viewer should feel, extracted from the post's tone.
        6. PEOPLE: No front-facing figures, no legible faces. People are allowed and encouraged when natural to the scene — shown from behind, side, above, or as partial figures (hands, torso, silhouette). Figures should appear candid and in motion, never posed or stock-photo.
        7. TECHNICAL: End every prompt with exactly this —
        "Shot on Sony A7, f/1.8, shallow depth of field, 1:1 square crop, no watermark, no legible text."
        8. IMPERFECTION: Include one small, realistic imperfection natural to the business type — examples: a condensation ring on a wooden table, a scuff on a worn brick wall, a stray leaf on a patio stone, steam caught mid-curl above a cup, a slightly uneven stack of plates. This detail should feel incidental, never the focus. Its purpose is to strip the "AI-perfect" sheen and make the image feel like a real moment that was caught, not constructed.
        RULES:

        STRICT RULES:
        1. INTEGRATE COLORS: Use the brand colors naturally (e.g., "navy-blue napkins").
        2. MATCH THE MOOD: Ensure the atmosphere (lighting/vibe) matches the brand description.
        3. COMPOSITION: Choose a varied angle (Wide, Medium, or Detail).
        4. LOCALITY: Reference the ${location} context.
        5. TECHNICAL: End with "Shot on Sony A7, f/1.8, shallow depth of field, 1:1 square crop, no watermark, no legible text."
        6. OUTPUT ONLY THE FINAL PROMPT. No labels, no preamble.

        CRITICAL: Always start the final image prompt with "*Final H Generation*".
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

      let cleanDescription = visualDescription;

      // 1. THE SIGNAL SEARCH (The "Last Signal" Strategy)
      // We use the 'g' (global) flag to find ALL occurrences of the signal.
      const signalRegex = /\*?Final\s+H\s+Generation\*?/gi;
      const allMatches = cleanDescription.match(signalRegex);

      if (allMatches && allMatches.length > 0) {
        // We find the index of the VERY LAST occurrence in the text.
        // This ensures we skip all the "internal monologue" versions.
        const lastMatch = allMatches[allMatches.length - 1];
        const lastMatchIndex = cleanDescription.lastIndexOf(lastMatch);
        const signalEndIndex = lastMatchIndex + lastMatch.length;
        
        cleanDescription = cleanDescription.substring(signalEndIndex).trim();
      } else {
        // FALLBACK: If the AI missed the signal entirely, we try to salvage the prompt 
        // by looking for the last research tag or last backtick.
        if (cleanDescription.includes("</research>")) {
          cleanDescription = cleanDescription.split("</research>").pop()?.trim() || cleanDescription;
        } else if (cleanDescription.includes("`")) {
          const parts = cleanDescription.split("`").filter(p => p.trim().length > 10);
          cleanDescription = parts[parts.length - 1].trim();
        }
      }

      // 2. THE REFINERY (Removing labels and markdown noise)
      cleanDescription = cleanDescription
        // Remove structural labels (e.g., *Subject:*, *Lighting:*, *Step 1:*)
        .replace(/\*?[A-Z][a-z]+:\*/g, "") 
        .replace(/\*?[A-Z][a-z]+\s+Section:\*/gi, "")
        // Remove any remaining bold markers (**) or extra whitespace
        .replace(/\*\*/g, "")
        .replace(/\s+/g, ' ')
        .trim();

      // 3. FINAL SANITY CHECK
      if (cleanDescription.length < 10) {
        console.error("⚠️ Architect generated an empty or too-short prompt.");
        cleanDescription = "Cinematic lifestyle photography, high quality, detailed.";
      }
      
      
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