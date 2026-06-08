// app/api/prepare-image-prompt/route.ts
// REFACTORED VERSION - Post-type-specific data selection

import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";
import { NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';
import { FRAMEWORK_POST_TYPE_COMBINATIONS, getFramework, getSeason, SEASONALITY_CONTEXT, SEASONAL_NICHE_CONTEXT } from "@/lib/frameworks";
import { parseZones } from "@/lib/parse-business-intel";
import { buildBrandVariables } from "@/lib/image-brand-variables";
import { resolveZoneFocus, type ZoneKey } from "@/lib/post-type-zone-focus";
import { auth } from "@clerk/nextjs/server";
import { getImageModeTemplate } from '@/lib/image-mode-templates';
import { selectZonePhoto } from "@/lib/select-zone-photo";
import { fetchWeatherForCity } from "@/lib/weather";
import { getMultimodalImageTemplate, getLocalEventVariant } from '@/lib/image-mode-templates-multimodal';


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

const ARCHITECT_MODE: "GEMINI" | "GROQ" | "GEMMA" | "OPENROUTER" = "GEMMA";

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
      interior_layout: false,   // Detail shots don't need room layout
      interior_colors: false,   // Detail shots don't need wall colors
      zones: true,
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
      zones: true,
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
      zones: true,
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
    zones: true,
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
 * Structure block only — storefront / interior (unchanged behavior)
 */
function buildStructureBlock(brandIdentity: any, postType: string) {
  const needs = getVisualDataRequirements(postType);

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
  
  return structureParts.length > 0
    ? structureParts.join("\n\n")
    : "No spatial context needed — focus on subject detail.";
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
    const {
      postId: bodyPostId,
      currentMonth: bodyCurrentMonth,
      currentWeather: bodyCurrentWeather,
      currentTime: bodyCurrentTime,
      zoneFocus: zoneFocusOverride,
    } = body;
    postId = bodyPostId;

    if (!postId) {
      return NextResponse.json({ error: "Missing Post ID" }, { status: 400 });
    }

    // Post record is source of truth for copy + mode (not live dashboard state).
    const { data: post, error: postError } = await supabase
      .from("community_posts")
      .select("id, content, post_type, content_category, business_name, location_snapshot, voice_used")
      .eq("id", postId)
      .eq("business_id", userId)
      .single();

    if (postError || !post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const generatedPost = (post.content || "").trim();
    if (!generatedPost) {
      return NextResponse.json({ error: "Post has no content" }, { status: 400 });
    }

    const postType = (post.post_type || "Behind the scenes").trim();

    // Fetch brand data (zones, colors, niche — current profile for visuals)
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select(`
        business_name, street, city, province_state, country, postal_code, category,
        niche, voice, business_description, color_theme, business_visuals, 
        storefront_architecture, interior_layout, zones, timezone
      `)
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (businessError || !business) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Some clients don't send time/month/weather; compute safe fallbacks server-side.
    const now = new Date();
    const businessTimeZone: string | undefined =
      typeof business.timezone === "string" && business.timezone.trim().length > 0
        ? business.timezone.trim()
        : undefined;

    const safeFormat = (options: Intl.DateTimeFormatOptions, fallback: () => string) => {
      try {
        return new Intl.DateTimeFormat("en-US", {
          ...(businessTimeZone ? { timeZone: businessTimeZone } : {}),
          ...options,
        }).format(now);
      } catch {
        return fallback();
      }
    };

    const currentTime =
      typeof bodyCurrentTime === "string" && bodyCurrentTime.trim().length > 0
        ? bodyCurrentTime.trim()
        : safeFormat(
            { hour: "numeric", minute: "2-digit" },
            () => now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
          );

    const currentMonth =
      typeof bodyCurrentMonth === "string" && bodyCurrentMonth.trim().length > 0
        ? bodyCurrentMonth.trim()
        : safeFormat({ month: "long" }, () => now.toLocaleString("en-US", { month: "long" }));

    let currentWeather =
      typeof bodyCurrentWeather === "string" && bodyCurrentWeather.trim().length > 0
        ? bodyCurrentWeather.trim()
        : "";

    if (!currentWeather && business.city) {
      currentWeather = await fetchWeatherForCity(business.city);
      if (currentWeather) {
        console.log(`--- WEATHER (prepare-image-prompt): ${currentWeather} ---`);
      }
    }

    if (!currentWeather) {
      currentWeather = "Unknown";
    }

    const fullAddress =
      (typeof post.location_snapshot === "string" && post.location_snapshot.trim()) ||
      `${business.street}, ${business.city}, ${business.province_state}, ${business.country} ${business.postal_code}`;
    const business_name =
      (typeof post.business_name === "string" && post.business_name.trim()) ||
      business.business_name;
    const brandIdentity = {
      ...business,
      zones: parseZones(business.zones),
    };
    const niche = business.niche;
    const voice =
      (typeof post.voice_used === "string" && post.voice_used.trim()) || business.voice;

    // Calculate strategy & season
    const season = getSeason(currentMonth);
    const framework = getFramework(
      business.category || "Food & Beverage",
      postType,
      voice,
    );
    const combinationKey = `${framework}_${postType}`;
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
    const zoneKeys = resolveZoneFocus(postType, zoneFocusOverride);
    console.log("Data Needs:", needs);
    console.log(
      "Zone focus:",
      zoneKeys.join(", "),
      zoneFocusOverride ? "(request override)" : "(POST_TYPE_ZONE_FOCUS config)"
    );
    console.log("--------------------------------");

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
    const structureBlock = buildStructureBlock(brandIdentity, postType);
    const b = buildBrandVariables(brandIdentity, postType, {
      zoneFocusOverride,
      includeLogoColors: needs.logo_colors,
    });

    const voiceDescription = VOICE_VISUAL_MAP[POST_TYPE_TO_VOICE[postType]];

    // ============================================================================
// GEMINI MULTIMODAL PATH
// Controlled by IMAGE_GENERATION_MODE=GEMINI_MULTIMODAL in .env
// Falls back to architect path automatically if no zone photo or on error
// ============================================================================
const IMAGE_GEN_MODE = process.env.IMAGE_GENERATION_MODE || "GEMINI_MULTIMODAL";

if (IMAGE_GEN_MODE === "GEMINI_MULTIMODAL") {
  console.log("🎨 [GEMINI_MULTIMODAL] Starting multimodal path...");

  try {
    // ── 1. Resolve zone for Local event / news (conditional) ──
    let localEventVariant: "exterior" | "interior" | undefined;
    let resolvedZoneOverride: ZoneKey | ZoneKey[] | undefined = zoneFocusOverride;

    if (postType === "Local event / news") {
      localEventVariant = getLocalEventVariant(post.content_category);
      resolvedZoneOverride = localEventVariant === "exterior"
        ? "entrance"
        : "customer_space";
    }

    // ── 2. Select zone photo ──
    let { photoUrl, zoneKey, zoneLabel, fallbackReason } = await selectZonePhoto(
      supabase, userId, postType, resolvedZoneOverride
    );

    // ── 3. Fallback: exterior requested but no entrance photo → interior ──
    if (localEventVariant === "exterior" && !photoUrl) {
      console.log("[GEMINI_MULTIMODAL] No entrance photo — falling back to interior variant");
      localEventVariant = "interior";
      const fallback = await selectZonePhoto(supabase, userId, postType, "customer_space");
      photoUrl = fallback.photoUrl;
      zoneKey = fallback.zoneKey;
      zoneLabel = fallback.zoneLabel;
      fallbackReason = fallback.fallbackReason;
    }

    // ── 4. No photo at all → fall through to architect ──
    if (!photoUrl || !zoneLabel) {
      console.warn(`[GEMINI_MULTIMODAL] No zone photo (${fallbackReason}) — falling back to architect.`);

    } else {
      console.log(`[GEMINI_MULTIMODAL] ✅ Using ${zoneLabel} photo for "${postType}"`);

      // SENTINEL: clear stale image_prompt + image_url so the poller keeps
      // returning WAITING until we write image_url at the end of this path.
      await supabase.from('community_posts')
        .update({ image_prompt: null, image_url: null })
        .eq('id', postId);

      // ── 5. Build template block (hero already resolved by visual mode) ──
      const imageModeLogicMulti = getMultimodalImageTemplate(
        postType as any,
        business.category,
        { localEventVariant }
      );

      const multimodalPrompt = `
      TASK: Generate a single photographic image.
      The reference photo attached is the spatial anchor — match its room, lighting, and materials exactly.

      [POST]:
      Type: ${postType}
      "${generatedPost}"

      [VISUAL BRIEF]:
      ${imageModeLogicMulti}

      [VOICE]:
      ${voiceDescription}

      [BRAND]:
      ${business_name} — ${niche}
      Color mood: ${b.color_mood}
      Palette: ${b.color_primary} / ${b.color_secondary} / ${b.color_accent}

      [SPACE]:
      The reference photo shows the actual ${zoneLabel}. Anchor the hero there.
      Match its lighting quality, shadow direction, and color temperature exactly.
      Do not invent a different room.

      [TIMING]:
      ${currentMonth}, ${currentTime}
      Weather: ${currentWeather}

      [TECHNICAL]:
      - Hero: sharp focus
      - Background: softly blurred (f/1.8 equivalent)
      - People: welcome as atmosphere — blurred, partial, angled away, never identifiable
      - No faces in sharp focus
      - One subtle imperfection: ${imperfectionGuidance}
      - No text overlays, no watermarks
      - Square crop (1:1)

      Describe in one sentence what the image shows: hero, placement, lighting mood. Then generate it.
      `.trim();

      console.log("\n=== GEMINI MULTIMODAL PROMPT ===");
      console.log(multimodalPrompt);
      console.log("=== END PROMPT ===\n");

      // 3. Fetch zone photo and convert to base64
      const photoResponse = await fetch(photoUrl);
      if (!photoResponse.ok) throw new Error(`Failed to fetch zone photo: ${photoResponse.status}`);
      const photoArrayBuffer = await photoResponse.arrayBuffer();
      const photoBase64 = Buffer.from(photoArrayBuffer).toString('base64');
      const photoMimeType = photoResponse.headers.get('content-type') || 'image/jpeg';

      // 4. Call Gemini image model
      // Env: IMAGE_GEN_ENGINE_MODE = TOGGLE | FALLBACK  (default: FALLBACK)
      //      IMAGE_GEN_PROVIDER    = GOOGLE_API | OPENROUTER  (TOGGLE mode only)
      const IMAGE_GEN_ENGINE_MODE = process.env.IMAGE_GEN_ENGINE_MODE || "FALLBACK";
      const IMAGE_GEN_PROVIDER_PREF =
        (process.env.IMAGE_GEN_PROVIDER as "GOOGLE_API" | "OPENROUTER") || "GOOGLE_API";

      let generatedImageBase64: string | null = null;
      let generatedMimeType = 'image/png';
      let geminiTextPrompt = '';
      let usedImageProvider = "";

      // ── Provider A: Google API ──────────────────────────────────────────
      const tryGoogleAPI = async () => {
        console.log("[GEMINI_MULTIMODAL] Trying Google API...");
        const geminiImageModel = genAI.getGenerativeModel({
          model: "gemini-3.1-flash-image-preview",
          generationConfig: { responseModalities: ["IMAGE", "TEXT"] } as any,
        }, { apiVersion: 'v1beta' });

        const result = await geminiImageModel.generateContent([
          { inlineData: { data: photoBase64, mimeType: photoMimeType } },
          { text: multimodalPrompt },
        ]);

        const parts = result.response.candidates?.[0]?.content?.parts || [];
        let b64: string | null = null;
        let mime = 'image/png';
        let text = '';
        for (const part of parts) {
          if ((part as any).inlineData?.data) {
            b64  = (part as any).inlineData.data;
            mime = (part as any).inlineData.mimeType || 'image/png';
          }
          if ((part as any).text?.trim()) text = (part as any).text.trim();
        }
        if (!b64) throw new Error("Google API returned no image data — model may have returned text only");
        return { b64, mime, text };
      };

      // ── Provider B: OpenRouter ──────────────────────────────────────────
      const tryOpenRouter = async () => {
        console.log("[GEMINI_MULTIMODAL] Trying OpenRouter...");
        const orResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
            "HTTP-Referer": "https://shorlinestudio.ca",
            "X-OpenRouter-Title": "Shoreline Multimodal",
          },
          body: JSON.stringify({
            model: "google/gemini-3.1-flash-image-preview",
            modalities: ["image", "text"],
            messages: [{
              role: "user",
              content: [
                { type: "text", text: multimodalPrompt },
                { type: "image_url", image_url: { url: photoUrl } },
              ],
            }],
          }),
        });

        console.log("[OPENROUTER] Response status:", orResponse.status);
        const orRaw = await orResponse.text();
        if (orRaw.startsWith("<!DOCTYPE") || orRaw.startsWith("<html")) {
          throw new Error("OpenRouter returned HTML — check model ID or API key");
        }
        const orData = JSON.parse(orRaw);
        if (orData.error) throw new Error(`OpenRouter error: ${orData.error.message}`);

        const message = orData.choices?.[0]?.message;
        let b64: string | null = null;
        let mime = 'image/png';
        let text = '';
        if (typeof message?.content === "string" && message.content.trim()) {
          text = message.content.trim();
        }
        const images = message?.images;
        if (Array.isArray(images) && images.length > 0) {
          const dataUri = images[0]?.image_url?.url;
          if (dataUri) {
            const matches = dataUri.match(/^data:([^;]+);base64,(.+)$/);
            if (matches) { mime = matches[1]; b64 = matches[2]; }
          }
        }
        console.log("[OPENROUTER] text:", text.slice(0, 80), "| image:", b64 ? "yes" : "no");
        if (!b64) throw new Error("OpenRouter returned no image data");
        return { b64, mime, text };
      };

      // ── Router ──────────────────────────────────────────────────────────
      if (IMAGE_GEN_ENGINE_MODE === "TOGGLE") {
        console.log(`--- [GEMINI_MULTIMODAL] MODE: TOGGLE [Using ${IMAGE_GEN_PROVIDER_PREF}] ---`);
        const r = IMAGE_GEN_PROVIDER_PREF === "OPENROUTER"
          ? await tryOpenRouter()
          : await tryGoogleAPI();
        generatedImageBase64 = r.b64;
        generatedMimeType    = r.mime;
        geminiTextPrompt     = r.text;
        usedImageProvider    = IMAGE_GEN_PROVIDER_PREF;
      } else {
        // FALLBACK: Google → OpenRouter
        console.log("--- [GEMINI_MULTIMODAL] MODE: FALLBACK (google → openrouter) ---");
        try {
          const r = await tryGoogleAPI();
          generatedImageBase64 = r.b64;
          generatedMimeType    = r.mime;
          geminiTextPrompt     = r.text;
          usedImageProvider    = "GOOGLE_API";
          console.log("--- [GEMINI_MULTIMODAL] FALLBACK SUCCESS: google ---");
        } catch (googleErr) {
          console.warn("[GEMINI_MULTIMODAL] Google API failed, trying OpenRouter:", (googleErr as Error).message);
          const r = await tryOpenRouter();
          generatedImageBase64 = r.b64;
          generatedMimeType    = r.mime;
          geminiTextPrompt     = r.text;
          usedImageProvider    = "OPENROUTER";
          console.log("--- [GEMINI_MULTIMODAL] FALLBACK SUCCESS: openrouter ---");
        }
      }

      console.log(`[GEMINI_MULTIMODAL] Image generated via ${usedImageProvider}: "${geminiTextPrompt.slice(0, 80)}..."`);

      // 6. Upload generated image to Supabase post-images bucket
      const imageBuffer = Buffer.from(generatedImageBase64, 'base64');
      const blob = new Blob([imageBuffer], { type: generatedMimeType });
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.png`;

      const { error: uploadError } = await supabase.storage
        .from('post-images')
        .upload(fileName, blob, { contentType: generatedMimeType, upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('post-images')
        .getPublicUrl(fileName);

      const imageUrl = urlData.publicUrl;

      // 7. Save image_url FIRST — poller detects this and returns immediately,
      //    preventing the FLUX chain from firing while we're still saving.
      const { error: imageUrlError } = await supabase
        .from('community_posts')
        .update({ image_url: imageUrl })
        .eq('id', postId);
      if (imageUrlError) throw imageUrlError;

      // 8. Save Gemini's text description to image_prompt (for history + debug)
      const { error: promptError } = await supabase.rpc('update_post_image_prompt', {
        post_id: postId,
        new_prompt: geminiTextPrompt || `Gemini multimodal — ${zoneLabel} via ${usedImageProvider}`,
      });
      if (promptError) throw promptError;

      console.log(`✅ [GEMINI_MULTIMODAL] Prompt + image saved for Post ${postId}`);
      return NextResponse.json({
        success: true,
        imageUrl,
        method: 'GEMINI_MULTIMODAL',
        zoneUsed: zoneKey,
      });
    }

//---------------------delete to go back to fallback after testing

  } catch (multimodalError: any) {
    console.error("[GEMINI_MULTIMODAL] Failed:", multimodalError.message);

    // ⚠️ TESTING MODE: return error directly instead of falling back
    // Re-enable fallback after testing by removing this return
    await supabase.rpc('update_post_image_prompt', {
      post_id: postId,
      new_prompt: `ERROR: ${multimodalError.message}`,
    });
    return NextResponse.json(
      { error: multimodalError.message },
      { status: 500 }
    );

    // TODO: Re-enable fallback after testing:
    // Falls through to architect path below
  }
}
//---------------------------------------reactivate fallback after testing
//  } catch (multimodalError: any) {
//    console.error("[GEMINI_MULTIMODAL] Failed:", multimodalError.message, "— falling back to architect.");
//    // Falls through to architect path below
//  }
//}
//-------------------------------------------------------------------------


// ============================================================================
// ARCHITECT PATH (existing code — unchanged below)
// ============================================================================


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



[SEASONAL_CONTEXT]:
${season} | ${currentMonth} | ${currentTime}
Elements: ${seasonInfo?.visual_elements}
Lighting: ${seasonInfo?.time_of_day_guidance}
Weather: ${currentWeather || "N/A"} — one atmospheric touch only.
Niche: ${seasonalNicheContext}

[BRAND — COLOR & MOOD]:
Mood: ${b.color_mood}
Primary: ${b.color_primary} | Secondary: ${b.color_secondary} | Accent: ${b.color_accent}
Integrate into palette, props, lighting. Derive from niche/season if empty.

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
    Mood: ${b.color_mood}
    Primary: ${b.color_primary} | Secondary: ${b.color_secondary} | Accent: ${b.color_accent}
    Zone (${b.zone_label}): ${b.zone_arrangement}
    Focal: ${b.zone_focal} | Materials: ${b.zone_materials}
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

    
    const imageModeLogic = getImageModeTemplate(postType as any);

    // New the architect short prompt
    const architectPrompt = `
[SYSTEM]: Image prompt engineer for FLUX-2-pro. Commercial/lifestyle photography.

[TASK]:

Post: ${postType}

"${generatedPost}"

Business: ${business_name} (${niche})

[MODE LOGIC — THIS DRIVES THE IMAGE]:
${imageModeLogic}

[VOICE]:
${voiceDescription}

First-person presence. You are in the scene, not observing from outside.

[BRAND AUTHENTICITY]:
Mood: ${b.color_mood}
Palette: ${b.color_primary} / ${b.color_secondary} / ${b.color_accent}

Zone — ${b.zone_label} (from photos; use for setting and palette):
  Space: ${b.zone_arrangement}
  Focal: ${b.zone_focal}
  Materials: ${b.zone_materials}
  Lighting: ${b.zone_lighting}
  Activity: ${b.zone_activity}
  Colors: ${b.zone_color_dominant}, ${b.zone_color_supporting}, accent ${b.zone_color_accent}, ${b.zone_color_materials}



Layer the hero INTO this real business environment naturally.
Brand details are ground truth — not suggestions. If "Infer", construct
from business type and niche.

[LIGHTING & CONTEXT]
Time: ${currentTime}, ${currentMonth}
Weather: ${currentWeather}

[SHARED RULES]:
- Hero sharp, context blurred, background minimal
- Authenticity details should be broad textures FLUX can render
  ("flour dust" not "fine grain flour residue")
- No brand names in prompt
- No clutter or staged styling
- No legible faces — people are hands/bodies/silhouettes
- Storefront/signage: background only if visible
- Include one authenticity detail (wear, smudge, condensation, flour dust)
- One subtle imperfection: ${imperfectionGuidance}
- Never add imperfections to: people, products, clinical equipment
 
[OUTPUT]:
60-70 word FLUX-2-pro prompt with visual hierarchy.
 
Format:
[Composition]: [Hero from mode logic]. Shallow focus on [hero]. [Secondary elements] softly blurred [position]. [Background environment] out of focus. [Light source and time]. [Imperfection/authenticity detail]. Shot on Sony A7, f/1.8, 1:1 crop, no text.
 
Rules:
- Start with composition type (Detail close-up / Medium shot / Wide shot)
- Hero with specific visible detail — not conceptual
- "Shallow focus on [hero]" immediately after hero description
- Decorative elements de-emphasized: "softly blurred", "out of focus"
- Lighting: ONE dominant source, simple
- Actions physically visible, not conceptual
- End with: "Shot on Sony A7, f/1.8, 1:1 crop, no text"
 
<<<PROMPT_BEGIN>>>
`;


    let visualDescription = "";

    if (ARCHITECT_MODE === "GEMMA") {

      console.log("Shoreline Architect: Routing to Gemma 4...");
      
      console.log("\n\n🚀 === [FULL ARCH GEMMA PROMPT START] === \n");
      console.log(architectPrompt);
      console.log("\n === [FULL ARCH GEMMA PROMPT END] === \n\n");
      console.log(`--- PROMPT LENGTH: ${architectPrompt.length} characters, ~${Math.round(architectPrompt.length / 4)} tokens ---`);

      const result = await gemmaModel.generateContent(architectPrompt);
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
