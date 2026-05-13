// app/api/prepare-image-prompt/route.ts
// REFACTORED VERSION - Post-type-specific data selection

import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";
import { NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';
import { FRAMEWORK_POST_TYPE_COMBINATIONS, getSeason, SEASONALITY_CONTEXT, SEASONAL_NICHE_CONTEXT } from "@/lib/frameworks";
import { auth } from "@clerk/nextjs/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const tools = [{ googleSearch: {} }] as any;

const gemmaModel = genAI.getGenerativeModel({ 
  model: "models/gemma-4-31b-it", 
  tools: tools,
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

const ARCHITECT_MODE: "GEMINI" | "GROQ" | "GEMMA" | "OPENROUTER" = "OPENROUTER";

const textModel = genAI.getGenerativeModel({ model: "models/gemini-2.5-flash" }, { apiVersion: 'v1beta' });

const VOICE_VISUAL_MAP: Record<string, string> = {
  "Authoritative & Precise": 
    "Precise, controlled lighting with clinical clarity. Minimal props — only what earns its place. No warmth, no softness. Every element must justify its presence. Composition: centered, frontal, detail-focused. Show the correction clearly.",
  
  "Warm & Conversational": 
    "Soft, natural lighting with gentle shadows. Props suggest lived-in familiarity — worn surfaces, flour dust, fingerprints, condensation. One visible imperfection for authenticity. Human hands welcome if they reveal the moment. Composition: over-shoulder, mid-action, environmental context. Feel like you're working alongside.",
  
  "Bold & Direct": 
    "High-contrast lighting with decisive shadows. Punchy framing, dramatic angles when authentic. One hero, nothing competing. Make the moment impossible to miss. Composition: tight framing, strong visual hierarchy, dynamic without feeling staged.",
  
  "Clean & Understated": 
    "Flat, even lighting with no harsh shadows. Generous negative space. Minimal palette — two colors maximum. Restraint over richness. Remove anything that doesn't serve the moment. Composition: breathing room, geometric balance, elegant simplicity.",
};

const POST_TYPE_TO_VOICE: Record<string, string> = {
  "Behind the scenes": "Warm & Conversational",
  "Myth-busting": "Authoritative & Precise",
  "Tip of the Day": "Warm & Conversational",
  "Promotion / offer": "Bold & Direct",
  "Local event / news": "Warm & Conversational", // or Bold & Direct for big events
  "Community moment": "Warm & Conversational",
};

const POST_TYPE_VISUAL_INTENT: Partial<Record<string, string>> = {
  "Promotion / offer": 
    "This image supports a promotional offer. The visual job is 'reason to visit' — warm, inviting, specific to the offer. For product offers: abundance and welcome. For service offers: show the specific benefit or result. The hero should make viewers feel they'd be missing out by not going.",
  "Local event / news":
    "This image supports a local event or news post. The visual job is 'community energy' — the neighbourhood is alive, something is happening. If the truth is visible at street-level (signage, patio, storefront activity), show it. If it's a detail (new menu item, specific offering), reveal that. The business is part of the neighbourhood, not separate from it.",
  "Behind the scenes":
    "This image reveals process. The visual job is 'earned trust' — show one specific step that customers never see but immediately recognise as real craft. Raw materials, mid-process moments, tools in use. Not a finished product shot.",
  "Myth-busting":
    "This image supports a myth correction. The visual job is 'truth revealed' — the hero should be the real thing, not the assumed thing. Precise and authoritative. No warmth padding. The image should make the viewer feel they're seeing something they got wrong.",
  "Tip of the Day":
    "This image supports educational content. The visual job is 'craft knowledge made visible' — one specific detail that embodies the tip. Not generic. Specific enough that it could only illustrate this post.",
  "Community moment":
    "This image supports a community moment post. The visual job is 'belonging' — if people are present, they are the hero in genuine scenes of enjoyment or connection. If the moment is atmospheric without people, capture the sensory environment that creates the feeling of presence. Product or space provides context. The viewer should feel they are part of something worth being part of.",
};

// ============================================================================
// POST-TYPE-SPECIFIC DATA REQUIREMENTS
// ============================================================================
// Defines what brand data each visual job actually needs

const POST_TYPE_DATA_REQUIREMENTS = {
  // Detail shots - focus on craft/product, not space
  EDUCATION: {
    postTypes: ['Myth-busting', 'Tip of the Day'],
    needs: {
      color_theme: true,
      logo_colors: false,
      storefront: false,        // Detail shots don't need building context
      interior_layout: true,   // Detail shots don't need room layout
      interior_colors: true,   // Detail shots don't need wall colors
    }
  },
  
  // Process/space shots - interior environment matters
  OBSERVATION: {
    postTypes: ['Behind the scenes', 'Promotion / offer'],
    needs: {
      color_theme: true,
      logo_colors: true,
      storefront: true,          // Might shoot exterior
      interior_layout: true,     // ⭐ Show the workspace
      interior_colors: true,     // Accurate color rendering
    }
  },
  
  // Street/community shots - exterior and neighbourhood matter
  COMMUNITY: {
    postTypes: ['Local event / news', 'Community moment'],
    needs: {
      color_theme: true,
      logo_colors: false,
      storefront: true,          // ⭐ Street-level exterior shots
      interior_layout: true,    // Outdoor/street scenes
      interior_colors: true,    // Outdoor/street scenes
    }
  },
};

/**
 * Get data requirements for a specific post type
 */
function getVisualDataRequirements(postType: string) {
  for (const category of Object.values(POST_TYPE_DATA_REQUIREMENTS)) {
    if (category.postTypes.includes(postType)) {
      return category.needs;
    }
  }
  // Default: include everything (safest fallback)
  return {
    color_theme: true,
    logo_colors: true,
    storefront: true,
    interior_layout: true,
    interior_colors: true,
  };
}

// ============================================================================
// HELPER FUNCTIONS - Format structured data into readable blocks
// ============================================================================

/**
 * Format interior_layout JSONB into readable text
 * Converts: {"counter_position": "...", "lighting_mood": "..."}
 * Into: Clean, structured text the Architect can use
 */
function formatInteriorLayout(layout: any): string {
  if (!layout) return "Infer from business type and niche";
  
  // Handle string (legacy data)
  if (typeof layout === 'string') {
    return layout;
  }
  
  // Handle JSONB object
  const parts: string[] = [];
  
  if (layout.distinctive_design_feature) {
    parts.push(`Key Feature: ${layout.distinctive_design_feature}`);
  }
  if (layout.lighting_mood) {
    parts.push(`Lighting: ${layout.lighting_mood}`);
  }
  if (layout.seating_style_density) {
    parts.push(`Seating: ${layout.seating_style_density}`);
  }
  if (layout.counter_position) {
    parts.push(`Counter: ${layout.counter_position}`);
  }
  if (layout.open_plan_or_divided_spaces) {
    parts.push(`Layout: ${layout.open_plan_or_divided_spaces}`);
  }
  
  return parts.length > 0 
    ? parts.join("\n  ") 
    : "Infer from business type and niche";
}

/**
 * Format storefront_architecture JSONB into readable text
 */
function formatStorefrontArchitecture(arch: any): string {
  if (!arch) return "Infer from neighbourhood and business type";
  
  // Handle string (legacy data)
  if (typeof arch === 'string') {
    return arch;
  }
  
  // Handle JSONB object
  const parts: string[] = [];
  
  if (arch.building) {
    // Check if building is a string or object
    if (typeof arch.building === 'string') {
      parts.push(`Building: ${arch.building}`);
    } else {
      // Handle nested building object (if it exists)
      const building = arch.building;
      const buildingParts: string[] = [];
      
      if (building.facade_style) buildingParts.push(building.facade_style);
      if (building.material) buildingParts.push(building.material);
      if (building.stories) buildingParts.push(`${building.stories} stories`);
      if (building.window_type) buildingParts.push(building.window_type);
      if (building.door) buildingParts.push(`door: ${building.door}`);
      
      if (buildingParts.length > 0) {
        parts.push(`Building: ${buildingParts.join(", ")}`);
      }
    }
  }
  
  if (arch.features) {
    // Check if features is a string or object
    if (typeof arch.features === 'string') {
      parts.push(`Features: ${arch.features}`);
    } else {
      // Handle nested features object (if it exists)
      const features = arch.features;
      const featureParts: string[] = [];
      
      if (features.patio) featureParts.push(`patio: ${features.patio}`);
      if (features.corner_unit) featureParts.push(features.corner_unit);
      if (features.planters) featureParts.push(`planters: ${features.planters}`);
      if (features.street_furniture) featureParts.push(`street furniture: ${features.street_furniture}`);
      
      if (featureParts.length > 0) {
        parts.push(`Features: ${featureParts.join(", ")}`);
      }
    }
  }
  
  return parts.length > 0 
    ? parts.join("\n  ") 
    : "Infer from neighbourhood and business type";
}

/**
 * Format logoColors object into readable text
 */
function formatLogoColors(logoColors: any): string {
  if (!logoColors) return "N/A";
  if (typeof logoColors === 'string') return logoColors;
  
  // Handle nested object
  const parts: string[] = [];
  if (logoColors.wordmark_primary) parts.push(logoColors.wordmark_primary);
  if (logoColors.graphic_secondary) parts.push(logoColors.graphic_secondary);
  if (logoColors.background) parts.push(`background: ${logoColors.background}`);
  
  return parts.length > 0 ? parts.join(", ") : "N/A";
}

/**
 * Format storefrontColors object into readable text
 */
function formatStorefrontColors(colors: any): string {
  if (!colors) return "N/A";
  if (typeof colors === 'string') return colors;
  
  // Handle nested object
  const parts: string[] = [];
  if (colors.facade_color) parts.push(`facade: ${colors.facade_color}`);
  if (colors.door_color) parts.push(`door: ${colors.door_color}`);
  if (colors.awning_color) parts.push(`awning: ${colors.awning_color}`);
  if (colors.signage_color) parts.push(`signage: ${colors.signage_color}`);
  
  return parts.length > 0 ? parts.join(", ") : "N/A";
}

/**
 * Format interiorColors object into readable text
 */
function formatInteriorColors(colors: any): string {
  if (!colors) return "N/A";
  if (typeof colors === 'string') return colors;
  
  // Handle nested object
  const parts: string[] = [];
  if (colors.wall_color) parts.push(`walls: ${colors.wall_color}`);
  if (colors.floor_material_color) parts.push(`floor: ${colors.floor_material_color}`);
  if (colors.ceiling_color) parts.push(`ceiling: ${colors.ceiling_color}`);
  if (colors.counter_material_color) parts.push(`counter: ${colors.counter_material_color}`);
  
  return parts.length > 0 ? parts.join(", ") : "N/A";
}

/**
 * Build brand identity blocks based on what this post type needs
 */
function buildBrandBlocks(brandIdentity: any, postType: string) {
  const needs = getVisualDataRequirements(postType);
  
  // COLOR & MOOD — always included (drives palette)
  const colorBlock = `
Mood:      ${brandIdentity.color_theme?.description || "Derive from niche and neighbourhood context"}
Primary:   ${brandIdentity.color_theme?.primary || "N/A"}
Secondary: ${brandIdentity.color_theme?.secondary || "N/A"}
Accent:    ${brandIdentity.color_theme?.accent || "N/A"}${needs.logo_colors ? `
Logo:      ${formatLogoColors(brandIdentity.business_visuals?.logoColors)}` : ''}
  `.trim();
  
  // STRUCTURE & SPACE — conditional based on post type needs
  const structureParts: string[] = [];
  
  if (needs.storefront) {
    structureParts.push(`
[STOREFRONT — for exterior shots]
  Colors: ${formatStorefrontColors(brandIdentity.business_visuals?.storefrontColors)}
  ${formatStorefrontArchitecture(brandIdentity.storefront_architecture)}
    `.trim());
  }
  
  if (needs.interior_layout || needs.interior_colors) {
    const interiorParts: string[] = [];
    
    if (needs.interior_colors) {
      interiorParts.push(`Colors: ${formatInteriorColors(brandIdentity.business_visuals?.interiorColors)}`);
    }
    
    if (needs.interior_layout) {
      interiorParts.push(formatInteriorLayout(brandIdentity.interior_layout));
    }
    
    if (interiorParts.length > 0) {
      structureParts.push(`
[INTERIOR — for indoor shots]
  ${interiorParts.join("\n  ")}
      `.trim());
    }
  }
  
  const structureBlock = structureParts.length > 0 
    ? structureParts.join("\n\n") 
    : "No spatial context needed — focus on subject detail.";
  
  return { colorBlock, structureBlock };
}

// Extract and store composition type when saving the prompt
const detectComposition = (prompt: string): string => {
  const lower = prompt.toLowerCase();
  if (lower.includes("wide") || lower.includes("environmental") || lower.includes("exterior") || lower.includes("street")) return "Wide";
  if (lower.includes("medium scene") || lower.includes("medium shot") || lower.includes("mid-shot")) return "Medium";
  if (lower.includes("close-up") || lower.includes("detail") || lower.includes("macro")) return "Detail";
  return "Unknown";
};

// ============================================================================
// MAIN HANDLER
// ============================================================================

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let postId: string | null = null;

  try {
    const body = await req.json();
    const { postId: bodyPostId, currentMonth, generatedPost, postType, currentWeather } = body;
    postId = bodyPostId;

    if (!postId) {
      return NextResponse.json({ error: "Missing Post ID" }, { status: 400 });
    }

    // Fetch brand data
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select(`
        business_name, street, city, province_state, country, postal_code,
        niche, voice, business_description, color_theme, business_visuals, 
        storefront_architecture, interior_layout
      `)
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (businessError || !business) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const fullAddress = `${business.street}, ${business.city}, ${business.province_state}, ${business.country} ${business.postal_code}`;
    const business_name = business.business_name;
    const brandIdentity = business;
    const niche = business.niche;
    const voice = business.voice;

    // Calculate strategy & season
    const season = getSeason(currentMonth);
    const combinationKey = `${body.framework}_${body.postType}`;
    const visualStrategy = (FRAMEWORK_POST_TYPE_COMBINATIONS as any)[combinationKey] || "Create a compelling visual for this post type.";
    const seasonInfo = SEASONALITY_CONTEXT[season as keyof typeof SEASONALITY_CONTEXT];
    const seasonalNicheContext = SEASONAL_NICHE_CONTEXT[season]?.[niche] || 
      `Create a visual that captures the essence of ${niche} in ${season}.`;

    // Fetch recent image prompts for variety
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

    console.log("--- ARCHITECT DATA SELECTION ---");
    console.log("Post Type:", postType);
    const needs = getVisualDataRequirements(postType);
    console.log("Data Needs:", needs);
    console.log("--------------------------------");

    const currentTime = new Date().toLocaleTimeString('en-US', { 
      hour: 'numeric', minute: '2-digit', hour12: true 
    });

        /**
     * Get imperfection guidance based on niche
     * Prevents unsafe imperfections (skin texture, product damage, etc.)
     */
    function getImperfectionGuidance(niche: string): string {
      // Food/Beverage - workspace imperfections acceptable
      if (['Bakery', 'Coffee Shop', 'Restaurant', 'Café', 'Bistro'].some(n => niche.includes(n))) {
        return 'Flour dust, condensation, steam, or soft shadow variation';
      }
      
      // Healthcare/Beauty/Wellness - lighting variation only
      if (['Medical Esthetician', 'Dermatologist', 'Spa', 'Salon', 'Fitness', 'Physiotherapist', 'Chiropractor', 'Massage', 'Wellness'].some(n => niche.includes(n))) {
        return 'Lighting variation only: soft shadow edge, gentle reflection';
      }
      
      // Default - safe environmental imperfections
      return 'Soft shadow, floor texture, or natural reflection';
    }
 
    const imperfectionGuidance = getImperfectionGuidance(niche);

    // ✨ NEW: Build brand blocks based on what this post type needs
    const { colorBlock, structureBlock } = buildBrandBlocks(brandIdentity, postType);

    const voiceDescription = VOICE_VISUAL_MAP[POST_TYPE_TO_VOICE[postType]];

    const visualIntent = POST_TYPE_VISUAL_INTENT[postType]


    // Legacy the architect prompt
    const architectLegacyPrompt = `
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
${colorBlock}
Integrate colors into palette, props, lighting. No color commentary. Derive from niche/season if N/A.

[BRAND — STRUCTURE & SPACE]:
${structureBlock}
${needs.storefront ? "Exterior shots: use Storefront details for architecture and location context." : ""}
${needs.interior_layout ? "Interior shots: use Interior details as spatial blueprint." : ""}
${!needs.storefront && !needs.interior_layout ? "Focus on subject detail — no spatial context needed." : ""}
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

    // New the architect prompt
    const architectlongPrompt = `
    [SYSTEM]: Image prompt engineer for FLUX-2-pro. Commercial/lifestyle photography.

    [TASK]:
    Post: "${generatedPost}"
    Business: ${business_name} (${niche})
    Job: ${POST_TYPE_VISUAL_INTENT[postType]}

 
    [HERO — VISUAL TRUTH EXTRACTION]:
    
    Step 1 — READ THE POST DEEPLY:
    What specific insight, truth, or revelation is this post teaching?
    Don't just identify the general activity ("assessment", "baking", "treatment").
    Find the SPECIFIC CLAIM or "aha moment" the post makes.
    
    Step 2 — IDENTIFY WHAT MAKES IT VISIBLE:
    What physical detail, gesture, tool, or moment would prove this truth to someone looking?
    What would an expert see that a novice would miss?
    
    Step 3 — CHOOSE YOUR HERO:
    The hero is NOT the general process.
    The hero is the SPECIFIC VISUAL EVIDENCE of the post's truth.
    
    Examples:
    ❌ "Invisible patterns" → Generic assessment scene
    ✅ "Invisible patterns" → Hands measuring angle patient can't feel
    
    ❌ "Water quality matters" → Water tank shot
    ✅ "Water quality matters" → pH meter + sample jar, precision visible
    
    ❌ "Assessment prevents injury" → Generic exercise
    ✅ "Assessment prevents injury" → Therapist observing squat, catching what patient misses
    
    THE TEST: Would this make someone say "I never noticed that"?
    
    Step 4 — DETERMINE COMPOSITION:
    Detail / Medium / Wide — whatever makes the hero most visible.
    
    ${postType === 'Community moment' 
      ? 'EXCEPTION: For Community moment only, people ARE the hero. Show genuine human connection, business as backdrop. Medium-to-wide composition.' 
      : ''}

    [VOICE]: ${VOICE_VISUAL_MAP[voice]}

    [BRAND AUTHENTICITY]:
    Colors: ${colorBlock}
    ${structureBlock}

    Layer the hero INTO this real business environment.

    [AVOID]: ${recentImageHistory || 'None'}

    [SPEC — HIERARCHICAL FLUX-2-PRO PROMPT]:
    
    Write a 60-70 word prompt with STRICT VISUAL HIERARCHY for FLUX-2-pro:
    
    LAYER 1 — SHARP FOCUS (Hero Only):
    The visual truth from [HERO] above. This gets ALL the detail and sharpness.
    
    LAYER 2 — SOFT FOCUS (Secondary Elements):
    Brand colors and materials mentioned softly.
    Decorative elements (ornate furniture, patterned fabrics, elaborate details) MUST be de-emphasized.
    Use: "softly blurred", "out of focus", "barely visible", "blurred behind/below"
    
    LAYER 3 — BACKGROUND (Minimal Description):
    General setting, ambient lighting. Keep brief.
    
    CRITICAL FLUX-2-PRO INSTRUCTIONS:
    ✅ Start with composition type: "Macro detail:" / "Close detail:" / "Medium shot:" / "Wide shot:"
    ✅ Immediately after hero, state: "Shallow depth of field" or "Shallow focus on [hero]"
    ✅ De-emphasize decorative patterns explicitly: "pattern softly blurred", "ornate details out of focus"
    ✅ Lighting: ONE dominant source, others mentioned softly (avoid complex multi-source descriptions)
    ✅ For detail/macro shots: Keep background descriptions to ONE sentence maximum
    
    AVOID THESE PATTERNS (they cause visual clutter):
    ❌ Equal detail to multiple elements: "Client wears ornate cape. Hexagonal lights overhead. Concrete floor with clippings."
    ❌ Brand-name patterns: "Versace-style cape" (too visually strong)
    ❌ Foreground clutter: "Scattered clippings", "Various tools"
    ❌ Complex lighting: "Warm amber blends with cool LED mixed with natural window light"
    
    GOOD PATTERN (Visual Hierarchy):
    ✅ "Macro detail: [hero]. Shallow focus on [hero element]. [Decoration] softly blurred [position]. [Background] out of focus. [Simple lighting]."
    
    EXAMPLE — GOOD (Hero-Focused):
    "Macro detail: barber's fingertip lifting single hair strand at temple, checking growth direction. Shallow focus on finger and hair. Gold chair pattern softly blurred behind. Charcoal walls out of focus. Warm morning light. Shot on Sony A7, f/1.8, 1:1 crop, no text."
    
    EXAMPLE — BAD (Flat Hierarchy):
    "Barber's fingertip lifting hair at temple. Client wears ornate black and gold Versace cape. Hexagonal LED ceiling lights overhead. Concrete floor with scattered hair clippings. Charcoal walls. Morning light blends with LED glow."
    
    Notice: GOOD starts with hero, uses explicit blur language. BAD lists everything equally.
    
    YOUR PROMPT MUST INCLUDE:
    - Composition type first (Macro/Close/Medium/Wide)
    - Hero with specific action/gesture
    - "Shallow depth of field" or "Shallow focus on [hero]"
    - Decorative elements de-emphasized: "softly blurred", "out of focus"
    - ${currentMonth}, ${currentTime} lighting (simple, one dominant source)
    - One subtle imperfection: ${imperfectionGuidance}
    - Never add imperfections to: people, products, clinical equipment
    ${postType !== 'Community moment' 
      ? '- No legible faces, people secondary if visible' 
      : '- Genuine human connection, no posed shots, no eye contact'}
    - Storefront/signage: background only if visible
    - End with: "Shot on Sony A7, f/1.8, 1:1 crop, no text"
    
    <<<PROMPT_BEGIN>>> Write your hierarchical, hero-focused FLUX-2-pro prompt now:
    `;

    // New the architect short prompt
    const architectPrompt = `
    [SYSTEM]: Image prompt engineer for FLUX-2-pro. Commercial/lifestyle photography.

    [TASK]:
    Post: "${generatedPost}"
    Business: ${business_name} (${niche})

    Primary Job: This image captures the moment described in the post.

    Visual Intent: ${visualIntent}

    Approach: Start with the moment. Layer in the mode-specific intent.
    
    [MOMENT EXTRACTION]:
    Read the post carefully and identify:

    1. **The Moment**: What specific moment is happening?
      - Time of day mentioned or implied
      - Location/setting (kitchen, counter, prep area, etc.)
      - What phase of work (prep, service, cleanup, observation)

    2. **The Action**: What is the person doing?
      - Active work (pulling, cutting, adjusting, assembling)
      - Checking/monitoring (watching, measuring, testing)
      - Observing (noticing a pattern, seeing a detail)
      - Even "standing and watching" is an action

    3. **Point of Attention**: What are they looking at or focused on?
      - A material/ingredient in a specific state
      - A tool in use
      - A change happening (steam rising, color shifting, texture forming)
      - A measurement or indicator

    4. **Sensory Anchor**: What makes this moment specific and grounded?
      - Temperature (heat, cold, steam, condensation)
      - Light quality (morning, afternoon, evening, overhead, natural)
      - Sound implied (simmering, chopping, quiet)
      - Texture visible (worn surfaces, condensation, flour dust)

    The image captures THIS MOMENT, not a proof point for the claim.

    [HERO]:
    The hero is the main visual element that anchors the moment.

    **For observational posts (BTS, Community Moment, Local Event):**
    Determine the hero based on what's happening in the moment (see action-based logic below).

    **For instructional posts (Tip of the Day, Myth-busting):**
    The hero must show BOTH the moment AND the technique/correction being taught.
    - Tip: Show the action at the key step where the tip applies
    - Myth: Show the correct technique that disproves the myth

    The moment grounds it. The technique must be visible.

    Determine the hero based on what's happening:

    **If the person is checking/watching/monitoring:**
    Hero = what they're looking at + evidence of the checking action
    Examples:
    - Hands near dough, fingers testing texture
    - Thermometer in frame with the thing being measured
    - Looking into pot/oven (view of what they see)

    **If the person is mid-process:**
    Hero = the materials + hands in action
    Examples:
    - Knife mid-cut through ingredient
    - Hands pulling noodles from water
    - Spoon stirring/tasting

    **If the person is observing a pattern:**
    Hero = what they're noticing
    Examples:
    - Steam rising (if noticing condensation)
    - Color change in cooking material
    - Gap/space/timing they're watching

    **If the person is standing/waiting/pausing:**
    Hero = what occupies the space during the pause
    Examples:
    - The thing simmering/resting/holding
    - The workspace in that moment
    - The environmental detail they're noticing

    The hero creates presence: "I am here, looking at this, in this moment."

    [COMPOSITION LOGIC]:
    Choose composition based on how to best capture the moment's perspective:

    **Detail (close-up):**
    Use when: The moment is about noticing something small or specific
    Shows: What they're focused on, intimate view
    Feel: Over-the-shoulder, "looking closely at..."
    Example: Checking texture, measuring precisely, watching a small change

    **Medium (mid-shot):**
    Use when: The moment involves an action with materials
    Shows: Hands + materials + immediate context
    Feel: Mid-work, "doing this right now"
    Example: Assembling, adjusting, mid-process steps

    **Wide (environmental):**
    Use when: The moment is about the space/atmosphere or positioning
    Shows: Where this happens, spatial context
    Feel: "This is where I'm standing"
    Example: Observing the whole kitchen, waiting during a long process

    Not asking: "What proves the claim?"
    Asking: "What does being there look like?"

    [VOICE]:
    ${voiceDescription}

    First-person presence. You are in the scene, not observing from outside.

    [BRAND AUTHENTICITY]:
    Colors: ${colorBlock}
    ${structureBlock}

    Layer the hero INTO this real business environment naturally.

    [LIGHTING & CONTEXT]
    Time: ${currentTime}, ${currentMonth}
    Weather: ${currentWeather}

    [AVOID]:
    - Generic "prep area" shots without specific moment
    - Perfectly styled food photography (this is mid-work, not final presentation)  
    - Static product shots (show process, not result)
    - Proof-of-concept visuals (focus on moment, not demonstration)
    - Hands that look staged (they should be working, not posing)
    
    [MOMENT-TO-VISUAL TRANSLATION]:
    
    Step 1: Identify the moment's core action
    Step 2: Determine POV (whose perspective/where are they)
    Step 3: Choose hero (what they're focused on)
    Step 4: Select composition (how close/how much context)
    Step 5: Add sensory details (light, texture, temperature cues)
    
    [OUTPUT]:
    60-70 word FLUX-2-pro prompt with visual hierarchy capturing the moment:
    
    Format:
    [Composition]: [Hero action/state in the moment]. Shallow focus on [hero]. [Hands/perspective element if relevant]. [Decoration/context] softly blurred [position]. [Background environment] out of focus. [Light source and time]. [Imperfection/authenticity detail]. Shot on Sony A7, f/1.8, 1:1 crop, no text.
    
    Example (Moment-First):
    "Medium shot: Hands pulling fresh ramen noodles from boiling water, strands lifting with steam. Shallow focus on noodles mid-lift. Stainless steel pot edge and kitchen counter softly blurred below. Dark grey ceiling and pendant lights out of focus. Evening service light, 6:30 PM. Water droplets on counter. Shot on Sony A7, f/1.8, 1:1 crop, no text."
    
    Example (Moment-First):
    "Detail close-up: Fingertips pressing into proofed pizza dough surface, slight indent visible. Shallow focus on hand-dough contact point. Flour-dusted stainless steel tray edge softly blurred. Wood prep table and kitchen background out of focus. Morning prep light, 9 AM. Flour fingerprint on tray edge. Shot on Sony A7, f/1.8, 1:1 crop, no text."
    
    Rules:
    - Hero sharp, context blurred, background minimal
    - Hands visible when they're part of the moment's action
    - Perspective should feel present (not observational)
    - Actions should be physically visible, not conceptual ("checking heat" not "observing thermal distribution")
    - Authenticity details should be broad textures FLUX can render ("flour dust" not "fine grain flour residue")
    - Human elements (hands, arms, silhouette) when moment involves checking/doing
    - No brand names in prompt
    - No clutter or staged styling
    - No legible faces (people are hands/bodies in action)
    - Storefront/signage: background only if visible
    - Include one authenticity detail (wear, smudge, condensation, flour dust)
    
    <<<PROMPT_BEGIN>>>
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
    } else if (ARCHITECT_MODE === "OPENROUTER") {
      // ========================================
      // NEW: OpenRouter Handler
      // ========================================
      console.log("Shoreline Architect: Routing to OpenRouter (Haiku 4.5)...");
      
      console.log("\n\n🚀 === [FULL ARCH OPENROUTER PROMPT START] === \n");
      console.log(architectPrompt);
      console.log("\n === [FULL ARCH OPENROUTER PROMPT END] === \n\n");
      console.log(`--- PROMPT LENGTH: ${architectPrompt.length} characters, ~${Math.round(architectPrompt.length / 4)} tokens ---`);
      
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "HTTP-Referer": "https://shorlinestudio.ca",  // Required by OpenRouter
          "X-Title": "Shoreline Architect",              // Recommended
        },
        body: JSON.stringify({
          model: "anthropic/claude-haiku-4.5",  // Removed :beta suffix
          messages: [
            { role: "system", content: "Output only what is requested. No preamble." },
            { role: "user", content: architectPrompt }
          ],
          temperature: 0.7,
          max_tokens: 3000,
        }),
      });
    
      const raw = await response.text();
      
      // Check for HTML error page
      if (raw.startsWith("<!DOCTYPE") || raw.startsWith("<html")) {
        throw new Error("OpenRouter API endpoint not found or invalid request");
      }
    
      const data = JSON.parse(raw);
      
      // Check for API errors
      if (data.error) {
        throw new Error(`OpenRouter API error: ${data.error.message}`);
      }
      
      visualDescription = data.choices[0]?.message?.content || "";
    }

    let cleanDescription = visualDescription;

    console.log("\n=== RAW VISUAL DESCRIPTION (BEFORE CLEANUP) ===");
    console.log("Length:", visualDescription.length, "characters");
    console.log("Content:", visualDescription);
    console.log("=== END RAW DESCRIPTION ===\n");

    // Signal search (last signal strategy)
    const signal = "<<<PROMPT_BEGIN>>>";

    if (cleanDescription.includes(signal)) {
      const lastSignalIndex = cleanDescription.lastIndexOf(signal);
      cleanDescription = cleanDescription.substring(lastSignalIndex + signal.length).trim();
    } else {
      // Fallback: strip any preamble before the first photography term
      const photographyTerms = ["Medium shot", "Detail close-up", "Wide shot", "Close-up", "Cinematic", "Shot on"];

      let earliestIdx = -1;
      let earliestTerm = "";

      // Find the EARLIEST occurrence among all terms
      for (const term of photographyTerms) {
        const idx = cleanDescription.indexOf(term);
        if (idx >= 0 && (earliestIdx === -1 || idx < earliestIdx)) {
          earliestIdx = idx;
          earliestTerm = term;
        }
      }

      if (earliestIdx >= 0) {
        cleanDescription = cleanDescription.substring(earliestIdx).trim();
      }
    }

    // The refinery
    cleanDescription = cleanDescription
      .replace(/\*?[A-Z][a-z]+:\*/g, "") 
      .replace(/\*?[A-Z][a-z]+\s+Section:\*/gi, "")
      .replace(/\*\*/g, "")
      .replace(/\s+/g, ' ')
      .trim();

    // Final sanity check
    if (cleanDescription.length < 10) {
      console.error("⚠️ Architect generated an empty or too-short prompt.");
      cleanDescription = "Cinematic lifestyle photography, high quality, detailed.";
    }
    
    const detectedComposition = detectComposition(cleanDescription);
    
    // Save to Supabase
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