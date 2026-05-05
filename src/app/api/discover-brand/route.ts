// app/api/discover-brand/route.ts

import { NextResponse } from "next/server";
import { 
  discoverAndSaveBrandIdentity, 
  UploadedPhoto, 
  getBrandIdentity,
  analyzePhotosWithGemini 
} from "@/lib/brandDiscovery";
import { auth } from "@clerk/nextjs/server";
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { business_id, business_name, address, photos, category, niche } = await req.json();
    const uploadedPhotos: UploadedPhoto[] = photos || [];

    const currentBrandIdentity = await getBrandIdentity(business_id);
    const currentBrandSource = currentBrandIdentity.brand_source;

    console.log(`--- [Discovery API] User: ${business_name}, brandSource: '${currentBrandSource}', Photos: ${uploadedPhotos.length} ---`);

    // ─────────────────────────────────────────────────────────────────
    // PATH 1: TEXT SEARCH (Haiku) — Independent trigger
    // ─────────────────────────────────────────────────────────────────
    // Triggers: New user OR business name changed
    
    const hasNeverAnalyzed =
      !currentBrandSource ||
      !currentBrandIdentity.last_analyzed_business_name;

    const nameChanged =
      (currentBrandIdentity.last_analyzed_business_name || "") !==
      (business_name || "");

    const shouldTriggerTextDiscovery = hasNeverAnalyzed || nameChanged;

    if (shouldTriggerTextDiscovery) {
      if (hasNeverAnalyzed) {
        console.log(`🚀 [Discovery API] PATH 1: First-time user. Starting text research...`);
      } else {
        console.log(`🚀 [Discovery API] PATH 1: Business name changed. Re-running text research...`);
      }

      try {
        await discoverAndSaveBrandIdentity(
          business_id,
          business_name,
          address,
          [],  // Empty photos — text search only
          category || "",
          niche || ""
        );
        console.log(`✅ [Discovery API] PATH 1: Text research complete`);
      } catch (textError) {
        console.error(`❌ [Discovery API] PATH 1 failed:`, textError);
        throw textError;
      }
    } else {
      console.log(`⏭️  [Discovery API] PATH 1: Text research skipped (no changes)`);
    }

    // ─────────────────────────────────────────────────────────────────
    // PATH 2: VISION ANALYSIS (Gemini) — Independent trigger
    // ─────────────────────────────────────────────────────────────────
    // Triggers: At least 1 photo uploaded

    if (uploadedPhotos.length > 0) {
      console.log(`🚀 [Discovery API] PATH 2: Starting vision analysis for ${uploadedPhotos.length} photo(s)...`);

      try {
        const fullAddressString = `${address.street}, ${address.city}, ${address.province_state}, ${address.country} ${address.postalCode}`;

        const visionData = await analyzePhotosWithGemini(
          uploadedPhotos,
          business_name,
          fullAddressString
        );

        if (visionData && visionData.visuals) {
          // Save vision results directly to Supabase
          const { error: updateError } = await supabase
            .from('businesses')
            .update({
              color_theme: {
                primary: visionData.visuals.primary_color || "neutral",
                secondary: visionData.visuals.secondary_color || "neutral",
                accent: visionData.visuals.accent_color || "neutral",
                description: visionData.visuals.theme_description || "natural tones",
              },
              business_visuals: {
                logoColors: visionData.visuals.logo_colors || "Not provided",
                storefrontColors: visionData.visuals.storefront_colors || "Not provided",
                interiorColors: visionData.visuals.interior_colors || "Not provided",
              },
              storefront_architecture: visionData.visuals.storefront_architecture || null,
              interior_layout: visionData.visuals.interior_layout || "Not provided",
              brand_source: "photos",
            })
            .eq('id',  business_id);

          if (updateError) {
            console.error(`❌ [Discovery API] PATH 2: Failed to save vision data:`, updateError);
            throw updateError;
          }

          console.log(`✅ [Discovery API] PATH 2: Vision analysis complete and saved`);
        }
      } catch (visionError) {
        console.error(`❌ [Discovery API] PATH 2 failed:`, visionError);
        // Vision failure is non-critical — continue even if it fails
        console.log(`⚠️  [Discovery API] PATH 2: Vision failed but continuing (photos may be reprocessed later)`);
      }
    } else {
      console.log(`⏭️  [Discovery API] PATH 2: Vision analysis skipped (no photos)`);
    }

    // ─────────────────────────────────────────────────────────────────
    // SUMMARY
    // ─────────────────────────────────────────────────────────────────
    console.log(`✅ [Discovery API] COMPLETE for ${business_name}`);
    console.log(`   └─ TEXT SEARCH: ${shouldTriggerTextDiscovery ? "RAN" : "SKIPPED"}`);
    console.log(`   └─ VISION: ${uploadedPhotos.length > 0 ? "RAN" : "SKIPPED"}`);

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Discovery API Route Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}