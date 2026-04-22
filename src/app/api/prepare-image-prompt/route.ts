// MAIN HANDLER
// ─────────────────────────────────────────────
// app/api/prepare-image-prompt/route.ts

import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";
import { NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';
import { getBrandIdentity } from "@/lib/brandDiscovery";
import { FRAMEWORK_POST_TYPE_COMBINATIONS, getSeason, SEASONALITY_CONTEXT, SEASONAL_NICHE_CONTEXT } from "@/lib/frameworks";
import { ColorTheme, BusinessVisuals } from '@/lib/constants';


const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const tools = [  { googleSearch: {},}, ] as any;

const gemmaModel = genAI.getGenerativeModel({ 
  model: "models/gemma-4-31b-it", 
 // tools: tools, // <--- INTEGRATING THE RESEARCH TOOL
  generationConfig: {
    temperature: 0.7,
    maxOutputTokens: 1000,
    topP: 0.95,
  }
}, { apiVersion: 'v1beta' });

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ARCHITECT_MODE: "GEMINI" | "GROQ" | "GEMMA" = "GEMMA";

const textModel = genAI.getGenerativeModel({ model: "models/gemini-2.5-flash" }, { apiVersion: 'v1beta' });


export async function POST(req: Request) {
      let postId: string | null = null;
      let generatedPost= "";
      let business_name= "";
      let business_id= "";
      let street= "";
      let city= "";
      let province_state= "";
      let country= "";
      let postal_code= "";
      let niche= "";
      let voice= "";
      let framework= "";
      let postType= "";
      let currentMonth= "";
  
  try {
    const body = await req.json();
      postId= body.postId;
      generatedPost= body.generatedPost;
      business_name= body.business_name; 
      business_id= body.business_id;
      street = body.street;
      city = body.city;
      province_state = body.province_state;
      country = body.country;
      postal_code = body.postal_code;
      niche= body.niche;
      voice= body.voice;
      framework= body.framework;
      postType= body.postType;
      currentMonth= body.currentMonth;
  
    if (!postId || !business_id) {
      return NextResponse.json({ error: "Missing ID" }, { status: 400 });
    }

    const fullAddress = `${street}, ${city}, ${province_state}, ${country} ${postal_code}`;

    // ── FETCH BRAND IDENTITY (The "Fast Path") ─────────────────────────────
    // getBrandIdentity now returns color_theme, business_visuals,
    // storefront_architecture, and interior_layout
    const brandIdentity = await getBrandIdentity(business_id);

    // ── CALCULATE STRATEGY & SEASON ────────────────────────────────────────
    const season = getSeason(currentMonth);
    const combinationKey = `${body.framework}_${body.postType}`;
    const visualStrategy = (FRAMEWORK_POST_TYPE_COMBINATIONS as any)[combinationKey] || "Create a compelling visual for this post type.";
    const seasonInfo = SEASONALITY_CONTEXT[season as keyof typeof SEASONALITY_CONTEXT];
    const seasonalNicheContext = SEASONAL_NICHE_CONTEXT[season]?.[niche] || 
      `Create a visual that captures the essence of ${niche} in ${season}.`;

    // ── FETCH RECENT IMAGE PROMPTS ─────────────────────────────────────────
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
            const firstSentence = (p.image_prompt || "").split(/[.]/)[0].trim();
            return `- Prompt ${i + 1}: "${firstSentence}"`;
          })
          .join("\n")
      : null;

    console.log("--- RECENT IMAGE PROMPTS ---");
    console.log(recentImageHistory || "No previous image prompts found.");
    console.log("----------------------------");

    const currentTime = new Date().toLocaleTimeString('en-US', { 
      hour: 'numeric', minute: '2-digit', hour12: true });

    // ── BUILD BRAND IDENTITY BLOCK ─────────────────────────────────────────
    // Separates color/mood data from structural/spatial data so the Architect
    // can use them for different purposes in the prompt (palette vs. setting).
    //
    // COLOR & MOOD — drives palette, lighting vocabulary, emotional tone
    const brandColorBlock = `
      Mood:      ${brandIdentity.color_theme?.description         || "Derive from niche and neighbourhood context"}
      Primary:   ${brandIdentity.color_theme?.primary             || "N/A"}
      Secondary: ${brandIdentity.color_theme?.secondary           || "N/A"}
      Accent:    ${brandIdentity.color_theme?.accent              || "N/A"}
      Logo:      ${brandIdentity.business_visuals?.logoColors     || "N/A"}
    `.trim();

    // STRUCTURE & SPACE — drives physical setting, camera angle, composition
    const brandStructureBlock = `
      Storefront Colors:    ${brandIdentity.business_visuals?.storefrontColors  || "N/A"}
      Storefront Structure: ${(brandIdentity as any).storefront_architecture    || "Infer from neighbourhood and business type"}
      Interior Colors:      ${brandIdentity.business_visuals?.interiorColors    || "N/A"}
      Interior Layout:      ${(brandIdentity as any).interior_layout            || "Infer from business type and niche"}
    `.trim();

    // ── ARCHITECT PROMPT ───────────────────────────────────────────────────
    const architectPrompt = `
      [SYSTEM]: Expert AI Image Prompt Engineer. Specialization: Hyper-local commercial/lifestyle photography for FLUX.1-schnell.
      [CRITICAL_ACTION]: You MUST use the Google Search tool to find the actual storefront and interior of "${business_name}" in "${fullAddress}" before engineering the prompt.
      
      [FORBIDDEN_VISUALS]:
      ${recentImageHistory ? `STRICTLY FORBIDDEN (Already used):
      ${recentImageHistory}
      RULE: Choose a completely different subject, setting, or angle. 
      - If recent = Food/Drink → use Space/Exterior/Details.
      - If recent = Exterior → use Interior/Texture/Materials.
      - If recent = Waterfront → use Interior warmth/Close-ups.` : "No history. Full creative freedom."}

      [RESEARCH_GOALS]:
      Use Google Search for "${business_name}" at "${fullAddress}". Identify:
      1. Storefront: appearance, color, materials, architecture only. IGNORE signage text/logos.
      2. Outdoor features (patio, terrace, seating).
      3. Local landmarks/views visible from the business.
      4. Interior style (lighting, materials, color palette, vibe).
      5. Signature products/offerings.
      6. Unique branding details (uniforms, packaging, decor).
      (Fallback: If no specific data found, use ${fullAddress} neighbourhood context).

      [ANALYSIS]:
      Post Content: "${generatedPost}"
      Business: ${business_name} (${niche})
      Location: ${fullAddress}
      Visual Strategy: ${visualStrategy}

      [SEASONAL_CONTEXT]:
      Season: ${season} | Time: ${currentMonth}, ${currentTime}
      - Elements: ${seasonInfo?.visual_elements}
      - Time of Day: ${seasonInfo?.time_of_day_guidance}
      - Niche Insight: ${seasonalNicheContext}

      [BRAND_IDENTITY — COLOR & MOOD]:
      ${brandColorBlock}
      RULE: Integrate brand colors naturally into palette, props, and lighting.
      Match vocabulary to mood (e.g., Sophisticated = Elegant; Vibrant = Energetic).
      If values are N/A, derive from niche and season.

      [BRAND_IDENTITY — STRUCTURE & SPACE]:
      ${brandStructureBlock}
      RULE: Use "Storefront Structure" as the physical architecture for exterior shots
      (building type, facade material, window/door style, scale).
      Use "Interior Layout" as the spatial blueprint for interior shots
      (counter position, ceiling height, seating arrangement, floor material).
      These are not suggestions — they are the GROUND TRUTH of this physical space.
      If values say "Infer", use the business type + neighbourhood + niche to construct
      a believable real-world setting. Never use a generic or imaginary space.

      [ENGINEERING_SPEC]:
      Write a 5-sentence prompt for FLUX.1-schnell following this sequence:
      1. COMPOSITION: Select one (Wide environmental / Medium scene / Detail close-up). Do not label it; just apply it.
      2. SUBJECT: The hero element: product, or object, or scene. Use researched details. No legible faces. If human present, they support the hero — never dominate the frame.
      3. SIGNAGE STRATEGY: If business name is present, use only one of: Shallow depth of field (bokeh), or Angle displacement (partial frame), or Foreground occlusion (organic block).
      4. SETTING: Real physical space of the business in ${fullAddress}. Ground every detail in the [BRAND_IDENTITY — STRUCTURE & SPACE] block above.
      5. LIGHTING: Use ${seasonInfo?.lighting_mood} to define the exact light quality for ${currentMonth} at ${currentTime} in ${fullAddress}.
      6. MOOD: Extract emotion from the post tone.
      7. PEOPLE: Candid, secondary, never dominating, if partial: upper body minimum. No front-facing/legible faces. Never isolated body parts.
      8. IMPERFECTION: Include one subtle, realistic detail (e.g., condensation ring, scuff on brick, steam curl) to remove "AI sheen."
      9. TECHNICAL: End exactly with: "Shot on Sony A7, f/1.8, shallow depth of field, 1:1 square crop, no watermark, no legible text."

      [OUTPUT_RULES]:
      - ZERO text/logos/signage on any surface. Storefront = color+material only.
      - Business name NEVER appears on sign, awning, window, or object.
      - NO labels, NO preamble, NO commentary.
      - OUTPUT ONLY the final prompt.
      - CRITICAL: Always start the final image prompt with "*Final H Generation*".
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
      console.log("Shoreline Architect: Requesting Gemma 4 via Google AI SDK...");
      const result = await gemmaModel.generateContent(architectPrompt);

      const response = result.response;

      const groundingMeta = (response as any).candidates?.[0]
        ?.groundingMetadata?.webSearchQueries;  
      if (groundingMeta) {
        console.log("--- GEMMA SEARCHED FOR ---");
        console.log(groundingMeta);
      }

      visualDescription = result.response.text();
    }

    let cleanDescription = visualDescription;

    // ── SIGNAL SEARCH (Last Signal Strategy) ──────────────────────────────
    const signalRegex = /\*?Final\s+H\s+Generation\*?/gi;
    const allMatches = cleanDescription.match(signalRegex);

    if (allMatches && allMatches.length > 0) {
      const lastMatch = allMatches[allMatches.length - 1];
      const lastMatchIndex = cleanDescription.lastIndexOf(lastMatch);
      const signalEndIndex = lastMatchIndex + lastMatch.length;
      cleanDescription = cleanDescription.substring(signalEndIndex).trim();
    } else {
      if (cleanDescription.includes("</research>")) {
        cleanDescription = cleanDescription.split("</research>").pop()?.trim() || cleanDescription;
      } else if (cleanDescription.includes("`")) {
        const parts = cleanDescription.split("`").filter(p => p.trim().length > 10);
        cleanDescription = parts[parts.length - 1].trim();
      }
    }

    // ── THE REFINERY ───────────────────────────────────────────────────────
    cleanDescription = cleanDescription
      .replace(/\*?[A-Z][a-z]+:\*/g, "") 
      .replace(/\*?[A-Z][a-z]+\s+Section:\*/gi, "")
      .replace(/\*\*/g, "")
      .replace(/\s+/g, ' ')
      .trim();

    // ── FINAL SANITY CHECK ─────────────────────────────────────────────────
    if (cleanDescription.length < 10) {
      console.error("⚠️ Architect generated an empty or too-short prompt.");
      cleanDescription = "Cinematic lifestyle photography, high quality, detailed.";
    }
    
    // ── SAVE TO SUPABASE ───────────────────────────────────────────────────
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