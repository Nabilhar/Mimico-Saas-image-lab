// MAIN HANDLER
// ─────────────────────────────────────────────
// app/api/prepare-image-prompt/route.ts

import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";
import { NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';
import { FRAMEWORK_POST_TYPE_COMBINATIONS, getSeason, SEASONALITY_CONTEXT, SEASONAL_NICHE_CONTEXT } from "@/lib/frameworks";
import { auth } from "@clerk/nextjs/server";


const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const tools = [  { googleSearch: {},}, ] as any;

const gemmaModel = genAI.getGenerativeModel({ 
  model: "models/gemma-4-31b-it", 
  tools: tools, // <--- INTEGRATING THE RESEARCH TOOL
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

const VOICE_VISUAL_MAP: Record<string, string> = {
  "Authoritative & Precise": 
    "Tight composition. Minimal props — only what earns its place. Precise, controlled lighting. No warmth padding. Every element is intentional.",
  "Warm & Conversational": 
    "Wider scene with breathing room. Human presence welcome if it serves the hero. Soft natural light. Props that suggest lived-in familiarity — a worn edge, a fingerprint on glass.",
  "Bold & Direct": 
    "High contrast. Single strong subject, nothing competing. Punchy framing — close or dramatic angle. Light is decisive, not ambient.",
  "Clean & Understated": 
    "Generous negative space. Minimal palette — two tones maximum. Flat even light, no harsh shadows. Restraint over richness. If in doubt, remove an element.",
};

const POST_TYPE_VISUAL_INTENT: Partial<Record<string, string>> = {
  "Promotion / offer": 
    "This image supports a promotional offer. The visual job is 'reason to visit' — warm, inviting, specific to the offer. The hero should feel like something worth showing at a counter. Abundance and welcome over craft precision. The viewer should feel they'd be missing out by not going.",
  "Local event / news":
    "This image supports a local event or news post. The visual job is 'community energy' — the neighbourhood is alive, something is happening. Favour wider scenes over close-ups. If the setting can hint at the street, the season, or the community context — use it. The business is part of the neighbourhood, not separate from it.",
  "Behind the scenes":
    "This image reveals process. The visual job is 'earned trust' — show one specific step that customers never see but immediately recognise as real craft. Raw materials, mid-process moments, tools in use. Not a finished product shot.",
  "Myth-busting":
    "This image supports a myth correction. The visual job is 'truth revealed' — the hero should be the real thing, not the assumed thing. Precise and authoritative. No warmth padding. The image should make the viewer feel they're seeing something they got wrong.",
  "5 Tips":
    "This image supports educational content. The visual job is 'craft knowledge made visible' — one specific detail that embodies the tips. Not generic. Specific enough that it could only illustrate this post.",
  "Community moment":
    "This image supports a community moment post. The visual job is 'belonging' — real people in a genuine scene of enjoyment or connection, with the product or space as context not subject. Medium-to-wide environmental composition. No posed shots, no direct camera eye contact. The viewer should feel they are witnessing something worth being part of. People are the hero. The product or space is in the scene but never the subject.",

  };

// Extract and store composition type when saving the prompt
const detectComposition = (prompt: string): string => {
  const lower = prompt.toLowerCase();
  if (lower.includes("wide") || lower.includes("environmental") || lower.includes("exterior") || lower.includes("street")) return "Wide";
  if (lower.includes("medium scene") || lower.includes("medium shot") || lower.includes("mid-shot")) return "Medium";
  if (lower.includes("close-up") || lower.includes("detail") || lower.includes("macro")) return "Detail";
  return "Unknown";
};

export async function POST(req: Request) {
  // 1. Authenticate with Clerk
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let postId: string | null = null;

  try {
    const body = await req.json();
    const { postId: bodyPostId, currentMonth, generatedPost, framework, postType, currentWeather } = body;
    postId = bodyPostId; 


    if (!postId) {
      return NextResponse.json({ error: "Missing Post ID" }, { status: 400 });
    }
    // 2. Fetch the "Ground Truth" profile using the secure userId
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select(`
        business_name, street, city, province_state, country, postal_code,
        niche, voice, business_description, color_theme, business_visuals, 
        storefront_architecture, interior_layout
      `)
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const fullAddress = `${profile.street}, ${profile.city}, ${profile.province_state}, ${profile.country} ${profile.postal_code}`;

    // Map the profile data to variables used later in the script
    const business_name = profile.business_name;
    const brandIdentity = profile; 
    const niche = profile.niche;
    const voice = profile.voice;

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
      .select("image_prompt, composition_type") 
      .eq("business_id", userId)
      .neq("image_prompt", "EMPTY")
      .order("created_at", { ascending: false })
      .limit(3);

      const recentImageHistory = recentPrompts?.length
      ? recentPrompts
          .map((p, i) => {
            const firstSentence = (p.image_prompt || "").split(/[.]/)[0].trim();
            const composition = p.composition_type || "Unknown";
            return `- Prompt ${i + 1} [${composition}]: "${firstSentence}"`;
          })
          .join("\n")
      : null;

    console.log("--- RECENT IMAGE PROMPTS ---");
    console.log("🎨 Recent history passed to architect:", recentImageHistory);
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
    // storefront_architecture is now a JSON object: { building, features }
    const arch = (brandIdentity as any).storefront_architecture;
    const archBuilding = typeof arch === "object" ? arch?.building : arch;
    const archFeatures = typeof arch === "object" ? arch?.features : null;

    // STRUCTURE & SPACE — drives physical setting, camera angle, composition
    const brandStructureBlock = `
      Storefront Colors:    ${brandIdentity.business_visuals?.storefrontColors  || "N/A"}
      Storefront Structure: ${archBuilding || "Infer from neighbourhood and business type"}
      Location Features:    ${archFeatures || "None identified"}
      Interior Colors:      ${brandIdentity.business_visuals?.interiorColors    || "N/A"}
      Interior Layout:      ${(brandIdentity as any).interior_layout            || "Infer from business type and niche"}
    `.trim();

    // ── ARCHITECT PROMPT ───────────────────────────────────────────────────
    const architectPrompt = `
      [SYSTEM]: Expert image prompt engineer for FLUX.1-schnell. Hyper-local commercial/lifestyle photography.

      [SUBJECT EXTRACTION — DO THIS FIRST]:
      Read the post and identify:
      1. The specific craft truth the post is built around — this is the image hero.
        Not a generic business shot. The specific thing the post is about.
        Example: espresso extraction post → hero is the pour, not a café interior.
        Example: dry skin post → hero is a skincare texture, not a spa room.
      2. The single product, material, or process moment that best embodies that truth.
      3. Whether human presence serves the hero or distracts — if distraction, no people.
      Every subsequent decision flows from this extraction.

      [ANALYSIS]:
      Post: "${generatedPost}"
      Business: ${business_name} (${niche}) | ${fullAddress}
      Visual Strategy: ${visualStrategy}

      [VOICE]:
      "${voice}" — ${VOICE_VISUAL_MAP[voice] || "Clean and intentional. Every element earns its place."}

      [POST TYPE — VISUAL JOB]:
      ${postType}: ${POST_TYPE_VISUAL_INTENT[postType] || "Create a compelling visual that supports the post content."}

      [SEASONAL_CONTEXT]:
      ${season} | ${currentMonth} | ${currentTime}
      Elements: ${seasonInfo?.visual_elements}
      Lighting: ${seasonInfo?.time_of_day_guidance}
      Weather: ${currentWeather || "N/A"} — one atmospheric touch only.
      Niche: ${seasonalNicheContext}

      [BRAND — COLOR & MOOD]:
      ${brandColorBlock}
      Integrate colors into palette, props, lighting. No color commentary. Derive from niche/season if N/A.

      [BRAND — STRUCTURE & SPACE]:
      ${brandStructureBlock}
      Exterior shots: use Storefront Structure for architecture and Location Features for context.
      Interior shots: use Interior Layout as spatial blueprint.
      These are ground truth — not suggestions. If "Infer", construct from business type and niche.

      [FORBIDDEN]:
      ${recentImageHistory ? `Already used — strictly forbidden:
      ${recentImageHistory}

      Composition: if last was Detail → Wide or Medium. If last was Wide → Detail or Medium. Never repeat same composition twice in a row.
      Subject: Food/Drink → Space or Exterior. Detail close-up → Wide or Medium. Exterior → Interior or Texture. Waterfront → Interior or Close-up.` : "No history. Full creative freedom."}

      [RESEARCH]:
      Search "${business_name}" at "${fullAddress}" for seasonal offerings, branding details, visible landmarks.
      Brand Identity blocks take priority — search fills gaps only.

      [SPEC]:
      Write a 60-70 word prompt for FLUX.1-schnell in this sequence:
      1. Composition: Wide environmental / Medium scene / Detail close-up — apply, don't label.
      2. Subject: Hero from [SUBJECT EXTRACTION]. Grounded in craft truth. Specific detail from research. No legible faces — people are secondary, never dominating.
      3. Setting: Physical space from [BRAND — STRUCTURE & SPACE].
      4. Lighting: ${currentMonth}, ${currentTime}, ${fullAddress}. Use ${seasonInfo?.lighting_mood}.
      5. Mood + one imperfection (condensation ring, scuff on brick, steam curl) to remove AI sheen.
      6. End with: "Shot on Sony A7, f/1.8, shallow depth of field, 1:1 square crop, no watermark, no legible text."

      Storefront/signage: secondary only, mid/background, slightly out of focus if exterior.

      [OUTPUT]: <<<PROMPT_BEGIN>>> then prompt only. No labels, no preamble, no commentary.
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
    const signal = "<<<PROMPT_BEGIN>>>";

    if (cleanDescription.includes(signal)) {
      const lastSignalIndex = cleanDescription.lastIndexOf(signal);
      cleanDescription = cleanDescription.substring(lastSignalIndex + signal.length).trim();
    } else {
      // fallback: strip any preamble before the first photography term
      const photographyTerms = ["Shot on", "Cinematic", "Close-up", "Wide", "Medium shot", "A ", "An "];
      for (const term of photographyTerms) {
        const idx = cleanDescription.indexOf(term);
        if (idx > 0) {
          cleanDescription = cleanDescription.substring(idx).trim();
          break;
        }
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
    
    const detectedComposition = detectComposition(cleanDescription);
    
    // ── SAVE TO SUPABASE ───────────────────────────────────────────────────
    const { error: rpcError } = await supabase.rpc('update_post_image_prompt', {
      post_id: postId,
      new_prompt: cleanDescription
    });
  
    if (rpcError) throw rpcError;

    const { error: compError } = await supabase
      .from('community_posts')
      .update({ composition_type: detectedComposition })
      .eq('id', postId);
    
    if (compError) console.warn("Composition type save failed:", compError.message);

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