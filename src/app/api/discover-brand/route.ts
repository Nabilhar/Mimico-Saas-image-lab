// app/api/discover-brand/route.ts

import { NextResponse } from "next/server";
import { discoverAndSaveBrandIdentity, UploadedPhoto, getBrandIdentity } from "@/lib/brandDiscovery";
import { auth } from "@clerk/nextjs/server"; 

export async function POST(req: Request) {
  try {

    const { userId } = await auth(); // Get the authenticated user's ID from Clerk (await added)
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { business_name, address, photos } = await req.json();
    
    // photos is UploadedPhoto[] | undefined — both are valid
    const uploadedPhotos: UploadedPhoto[] = photos || [];

        // --- Start of NEW LOGIC: Determine if brand discovery needs to be triggered ---
        const currentBrandIdentity = await getBrandIdentity(userId);
        const currentBrandSource = currentBrandIdentity.brand_source; 
    
        // This flag will control whether we actually call discoverAndSaveBrandIdentity
        let shouldTriggerDiscovery = false; 
        
        // Log initial state for debugging
        console.log(`--- [Discovery API] Current brandSource: '${currentBrandSource}', New photos uploaded: ${uploadedPhotos.length} ---`);
    
        // **Step 3: Implement Condition 4: If brand_source is 'null' (First Time)**
        if (currentBrandSource === null) {
          console.log(`--- [Discovery API] Condition 4 met: brand_source is null. Triggering discovery. ---`);
          shouldTriggerDiscovery = true;
        } 
        // **Step 4: Implement Condition 1 and Condition 2 (Don't Trigger)**
        else if (currentBrandSource === "photos" && uploadedPhotos.length === 0) {
          console.log(`--- [Discovery API] Condition 1 met: Brand already 'photos' and no new uploads. Skipping. ---`);
          shouldTriggerDiscovery = false; // Explicitly set, though default is false
        } 
        else if (currentBrandSource === "text_search" && uploadedPhotos.length === 0) {
          console.log(`--- [Discovery API] Condition 2 met: Brand already 'text_search' and no new uploads. Skipping. ---`);
          shouldTriggerDiscovery = false; // Explicitly set
        }
        // **Step 5: Implement Condition 3 and Condition 5 (Trigger)**
        // If none of the 'skip' conditions (null, or no-new-photos while already analyzed) were met,
        // and new photos *were* uploaded, then we trigger discovery.
        else if (uploadedPhotos.length > 0) {
          console.log(`--- [Discovery API] Condition 3 or 5 met: New photos uploaded. Triggering discovery. ---`);
          shouldTriggerDiscovery = true;
        }
    
    
        // --- Execute discoverAndSaveBrandIdentity based on the flag ---
        if (shouldTriggerDiscovery) {
          console.log(`🚀 [Discovery API] Initiating full brand analysis for: ${business_name}`);
          // CRITICAL: We MUST await this on Vercel. 
          await discoverAndSaveBrandIdentity(userId, business_name, address, uploadedPhotos);
          
          console.log(`✅ [Discovery API] Research and save complete for: ${business_name}`);
        } else {
          console.log(`✅ [Discovery API] No new brand analysis required for: ${business_name}`);
        }
        
        return NextResponse.json({ success: true }); // Always respond with success (unless a true error occurs)
        
      } catch (error: any) {
        console.error("Discovery API Route Error:", error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }