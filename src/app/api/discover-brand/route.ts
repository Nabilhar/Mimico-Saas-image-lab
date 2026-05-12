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

const TEXT_DISCOVERY_COST = 3; 

export async function POST(req: Request) {
  try {

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { business_id, business_name, address, photos, category, niche, run_text_discovery = false  } = await req.json();
    const uploadedPhotos: UploadedPhoto[] = photos || [];

        // ─────────────────────────────────────────────────────────────────
    // STEP 1: Fetch user profile (tier, credits, free discovery status)
    // ─────────────────────────────────────────────────────────────────
    const { data, error: profileError } = await supabase
    .rpc('get_user_profile', { p_user_id: userId });
   
    if (profileError) {
      console.error("Failed to fetch user profile:", profileError);
      return NextResponse.json({ error: "Profile fetch failed" }, { status: 500 });
    }
    
    // Handle array return (get first item)
    const userProfile = Array.isArray(data) ? data[0] : data;
    
    const userTier = userProfile?.tier || 1;
    const userCredits = userProfile?.credits || 0;
    const freeDiscoveryUsed = userProfile?.free_text_discovery_used || false;

    console.log(`--- [Discovery API] User Tier: ${userTier}, Credits: ${userCredits}, Free Used: ${freeDiscoveryUsed} ---`);

    // ─────────────────────────────────────────────────────────────────
    // STEP 2: Get current brand identity
    // ─────────────────────────────────────────────────────────────────

    const currentBrandIdentity = await getBrandIdentity(business_id);
    const currentBrandSource = currentBrandIdentity.brand_source;

    console.log(`--- [Discovery API] User: ${business_name}, brandSource: '${currentBrandSource}', Photos: ${uploadedPhotos.length} ---`);

    // ─────────────────────────────────────────────────────────────────
    // STEP 3: Determine if text discovery should run (haiku)
    // ─────────────────────────────────────────────────────────────────
    // Triggers: New user OR business name changed
    
    const hasNeverAnalyzed =
      !currentBrandSource ||
      !currentBrandIdentity.last_analyzed_business_name;

    const nameChanged =
      (currentBrandIdentity.last_analyzed_business_name || "") !==
      (business_name || "");

      const shouldTriggerTextDiscovery = 
      run_text_discovery && (hasNeverAnalyzed || nameChanged);

        // ─────────────────────────────────────────────────────────────────
    // STEP 4: Credit Check for Tier 1 Users
    // ─────────────────────────────────────────────────────────────────
    let isFirstFreeDiscovery = false;

    if (userTier === 1 && shouldTriggerTextDiscovery) {
      // Check if this is their first free discovery
      if (!freeDiscoveryUsed && hasNeverAnalyzed) {
        console.log(`🎁 [Discovery API] First free text discovery for Tier 1 user`);
        isFirstFreeDiscovery = true;
      } else {
        // Need to check credits
        if (userCredits < TEXT_DISCOVERY_COST) {
          console.log(`❌ [Discovery API] Insufficient credits. Required: ${TEXT_DISCOVERY_COST}, Available: ${userCredits}`);
          return NextResponse.json({ 
            error: "Insufficient credits", 
            required: TEXT_DISCOVERY_COST,
            available: userCredits
          }, { status: 402 }); // 402 Payment Required
        }
        console.log(`💳 [Discovery API] Tier 1 user will be charged ${TEXT_DISCOVERY_COST} credits after successful discovery`);
      }
    }

    if (userTier === 2) {
      console.log(`👑 [Discovery API] Tier 2 user - text discovery is free`);
    }

    // ─────────────────────────────────────────────────────────────────
    // STEP 5: Run Text Discovery (if approved)
    // ─────────────────────────────────────────────────────────────────
    let textDiscoverySuccess = false;

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

        // Update last_text_discovery_at timestamp
        await supabase
          .from('businesses')
          .update({ last_text_discovery_at: new Date().toISOString() })
          .eq('id', business_id);

        textDiscoverySuccess = true;
        console.log(`✅ [Discovery API] PATH 1: Text research complete`);

        // ─────────────────────────────────────────────────────────────
        // STEP 6: Deduct Credits AFTER Successful Discovery
        // ─────────────────────────────────────────────────────────────
        if (userTier === 1) {
          if (isFirstFreeDiscovery) {
            // Mark free discovery as used
            await supabase.rpc('mark_free_discovery_used', { p_user_id: userId });
            console.log(`🎁 [Discovery API] Marked free discovery as used`);
          } else {
            // Deduct credits
            const { data: deductResult, error: deductError } = await supabase
              .rpc('deduct_credits', {
                p_user_id: userId,
                p_amount: TEXT_DISCOVERY_COST,
                p_reason: 'text_discovery',
                p_business_id: business_id,
                p_metadata: { business_name, timestamp: new Date().toISOString() }
              });

            if (deductError) {
              console.error(`❌ [Discovery API] Credit deduction failed:`, deductError);
              // Discovery succeeded but credit deduction failed - log this critical error
              // Consider implementing a retry queue or manual reconciliation
            } else {
              const result = typeof deductResult === 'string' ? JSON.parse(deductResult) : deductResult;
              console.log(`💳 [Discovery API] Credits deducted. New balance: ${result.balance}`);
            }
          }
        }

      } catch (textError) {
        console.error(`❌ [Discovery API] PATH 1 failed:`, textError);
        // Don't deduct credits if discovery failed
        return NextResponse.json({ 
          error: "Text discovery failed", 
          details: textError instanceof Error ? textError.message : String(textError)
        }, { status: 500 });
      }
    } else {
      console.log(`⏭️  [Discovery API] PATH 1: Text research skipped (user did not request or no changes)`);
    }

    // ─────────────────────────────────────────────────────────────────
    // STEP 7: Vision Analysis (Gemini) - Always Free
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