// brandDiscovery.ts

import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { BusinessIdentity } from '@/lib/constants';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ---------------------------------------------------------------------------
// TYPES
// ---------------------------------------------------------------------------

export interface UploadedPhoto {
  base64: string;   // Pure base64 string (no data URI prefix)
  mimeType: string; // e.g. "image/jpeg", "image/png"
  label: string;    // "storefront" | "logo" | "hero_product"
}

// ---------------------------------------------------------------------------
// THE LIGHT READER (Fast Path)
// Purpose: Called during the critical path of text generation.
// Only reads from the database — never waits for AI research.
// ---------------------------------------------------------------------------

export async function getBrandIdentity(userId: string): Promise<BusinessIdentity> {
  const { data, error } = await supabase
    .from('profiles')
    .select('color_theme, business_visuals')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error("Error fetching brand identity:", error.message);
    return { color_theme: null, business_visuals: null };
  }

  return {
    color_theme: data?.color_theme || null,
    business_visuals: data?.business_visuals || null,
  };
}

// ---------------------------------------------------------------------------
// PATH A: Gemini Vision Analysis (when user uploads photos)
// Sends the owner's own photos to Gemini for precise brand extraction.
// This is the gold standard path — real colors from real brand assets.
// ---------------------------------------------------------------------------

async function analyzePhotosWithGemini(
  photos: UploadedPhoto[],
  businessName: string,
  fullAddress: string
): Promise<any> {
  console.log(`[Gemini Vision] Analyzing ${photos.length} uploaded photos for ${businessName}...`);

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  // Build image parts — Gemini expects { inlineData: { data, mimeType } }
  const imageParts = photos.map((photo) => ({
    inlineData: {
      data: photo.base64,
      mimeType: photo.mimeType,
    },
  }));

  // Build a context string so Gemini knows what each photo represents
  const photoContext = photos
    .map((p, i) => `Photo ${i + 1}: ${p.label.replace("_", " ")}`)
    .join(", ");

  const textPrompt = `
    You are a professional brand analyst. The business owner of "${businessName}" (${fullAddress}) 
    has personally uploaded these photos of their business: ${photoContext}.

    These are the AUTHORITATIVE brand assets. Base ALL your analysis on what you 
    ACTUALLY SEE in these photos. Do not guess or infer what you can observe directly.

    STRICT OUTPUT REQUIREMENT:
    Return a JSON object with exactly these 8 keys.
    Do not use nested objects. Do not omit any keys.
    Only use "Not visible in photos" if a detail genuinely cannot be seen.

    REQUIRED FLAT JSON STRUCTURE:
    {
      "primary_color": "the dominant brand color you see (e.g., 'Deep Forest Green', 'Warm Terracotta')",
      "secondary_color": "the supporting color you see",
      "accent_color": "the contrast or highlight color you see",
      "theme_description": "a 1-sentence summary of the overall visual palette and mood",
      "logo_colors": "exact colors seen in the logo photo",
      "storefront_colors": "exact exterior colors, signage, and materials seen",
      "interior_colors": "interior colors, lighting warmth, and surface materials seen",
      "business_description": "A concise 2-3 sentence overview of what this business does, their primary products or services, and what makes them visually distinctive."
    }

    Output ONLY the JSON object. No preamble, no markdown fences, no conversation.
  `;

  const result = await model.generateContent([...imageParts, { text: textPrompt }]);
  const responseText = result.response.text();

  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error(`[Gemini Vision] No JSON in response. Raw: ${responseText.slice(0, 300)}`);
  }

  console.log("[Gemini Vision] Analysis complete ✅");
  return JSON.parse(jsonMatch[0]);
}

// ---------------------------------------------------------------------------
// PATH B: Gemini Text Search Fallback (when user skips photo upload)
// Uses Gemma 4 + Google Search grounding to make an educated brand estimate.
// Clearly labelled as an estimate — not real visual data.
// ---------------------------------------------------------------------------

async function analyzeWithTextSearch(
  businessName: string,
  fullAddress: string
): Promise<any> {
  console.log(`[Gemini Text] No photos uploaded — running text search fallback for ${businessName}...`);

  const tools = [{ googleSearch: {} }] as any;
  const model = genAI.getGenerativeModel(
    { model: "models/gemma-4-31b-it", tools },
    { apiVersion: "v1beta" }
  );

  const prompt = `
    Search for the business "${businessName}" located at "${fullAddress}".
    Your goal is to estimate their visual brand identity based on any online presence you can find.

    STRICT OUTPUT REQUIREMENT:
    Return a JSON object with exactly these 8 keys.
    Do not use nested objects. Do not omit any keys.
    Since you are working from web research only (not actual photos), use 
    "Thematic Inference" for any detail you cannot find directly — make a 
    professional estimate based on the business type and neighbourhood vibe.

    REQUIRED FLAT JSON STRUCTURE:
    {
      "primary_color": "estimated dominant color (e.g., 'Navy Blue')",
      "secondary_color": "estimated supporting color",
      "accent_color": "estimated contrast color",
      "theme_description": "a 1-sentence summary of the estimated color palette",
      "logo_colors": "estimated logo colors based on web research",
      "storefront_colors": "estimated storefront description based on web research",
      "interior_colors": "estimated interior description based on web research",
      "business_description": "A concise 2-3 sentence overview of what they do, their primary products or services, and what makes them unique."
    }

    Output ONLY the JSON object. No preamble, no conversation.
  `;

  const result = await model.generateContent(prompt);
  const responseText = result.response.text();

  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error(`[Gemini Text] No JSON in response. Raw: ${responseText.slice(0, 300)}`);
  }

  console.log("[Gemini Text] Fallback analysis complete ✅");
  return JSON.parse(jsonMatch[0]);
}

// ---------------------------------------------------------------------------
// THE HEAVY RESEARCHER (Slow Path)
// Purpose: Called in the BACKGROUND after the user saves their profile.
// Chooses Path A (vision) or Path B (text) based on whether photos were uploaded.
// Saves the extracted brand identity to the profiles table in Supabase.
// ---------------------------------------------------------------------------

export async function discoverAndSaveBrandIdentity(
  userId: string,
  businessName: string,
  address: {
    street: string;
    city: string;
    province_state: string;
    country: string;
    postalCode: string;
  },
  photos: UploadedPhoto[] = [] // Empty array = no photos uploaded = fallback path
): Promise<void> {
  console.log(`--- [BACKGROUND] BRAND DISCOVERY STARTED FOR: ${businessName} ---`);
  console.log(`    Path: ${photos.length > 0 ? `Vision (${photos.length} photos)` : "Text Search Fallback"}`);

  const fullAddressString = `${address.street}, ${address.city}, ${address.province_state}, ${address.country} ${address.postalCode}`;

  try {
    let extractedData: any = null;

    // ── Choose path based on whether the user uploaded photos ─────────────
    if (photos.length > 0) {
      // PATH A: Real visual analysis from owner-uploaded photos
      extractedData = await analyzePhotosWithGemini(photos, businessName, fullAddressString);
    } else {
      // PATH B: Text search educated guess
      extractedData = await analyzeWithTextSearch(businessName, fullAddressString);
    }

    // ── Reconstruct nested DB payload from flat AI response ───────────────
    const updatePayload: any = {};

    if (extractedData.business_description) {
      updatePayload.business_description = extractedData.business_description;
    }

    if (extractedData.primary_color || extractedData.theme_description) {
      updatePayload.color_theme = {
        primary:     extractedData.primary_color   || "neutral",
        secondary:   extractedData.secondary_color || "neutral",
        accent:      extractedData.accent_color    || "neutral",
        description: extractedData.theme_description || "natural tones",
      };
    }

    if (
      extractedData.logo_colors     ||
      extractedData.storefront_colors ||
      extractedData.interior_colors
    ) {
      updatePayload.business_visuals = {
        logoColors:       extractedData.logo_colors       || "Not provided",
        storefrontColors: extractedData.storefront_colors || "Not provided",
        interiorColors:   extractedData.interior_colors   || "Not provided",
      };
    }

    // ── Record which path ran so the UI knows what it's working with ────────
    // 'photos'      = real visual data from owner-uploaded images (gold standard)
    // 'text_search' = educated guess from Gemma web research (can be upgraded)
    updatePayload.brand_source = photos.length > 0 ? "photos" : "text_search";

    // ── Save to Supabase ───────────────────────────────────────────────────
    if (Object.keys(updatePayload).length > 0) {
      const { error: updateError } = await supabase
        .from("profiles")
        .update(updatePayload)
        .eq("id", userId);

      if (updateError) throw updateError;

      console.log("--- [BACKGROUND] BRAND DISCOVERY SAVED SUCCESSFULLY ---");
      console.log(`    Source:        ${updatePayload.brand_source}`);
      console.log(`    Colors found:  ${!!updatePayload.color_theme}`);
      console.log(`    Visuals found: ${!!updatePayload.business_visuals}`);
    }
  } catch (err) {
    console.error("--- [BACKGROUND] BRAND DISCOVERY FAILED ---", err);
  }
}