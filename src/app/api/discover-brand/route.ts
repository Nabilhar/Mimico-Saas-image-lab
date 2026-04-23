// app/api/discover-brand/route.ts

import { NextResponse } from "next/server";
import { discoverAndSaveBrandIdentity, UploadedPhoto } from "@/lib/brandDiscovery";

export async function POST(req: Request) {
  try {
    const { business_id, business_name, address, photos } = await req.json();

    // photos is UploadedPhoto[] | undefined — both are valid
    const uploadedPhotos: UploadedPhoto[] = photos || [];

    console.log(`🚀 [Discovery API] Starting background research for: ${business_name}`);
    console.log(`   Photos received: ${uploadedPhotos.length}`);

    // CRITICAL: We MUST await this on Vercel. 
    // If you return the response before this finishes, Vercel can terminate the background task.
    await discoverAndSaveBrandIdentity(business_id, business_name, address, uploadedPhotos);
    
    console.log(`✅ [Discovery API] Research and save complete for: ${business_name}`);
    return NextResponse.json({ success: true }); // Responds after research is done
    
  } catch (error: any) {
    console.error("Discovery API Route Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}