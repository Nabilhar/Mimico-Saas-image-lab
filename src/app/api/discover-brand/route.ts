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

    // Fire and forget — response is instant, research runs in background
    discoverAndSaveBrandIdentity(business_id, business_name, address, uploadedPhotos)
      .then(() => console.log(`✅ [Discovery API] Research complete for: ${business_name}`))
      .catch((err) => console.error("❌ [Discovery API] Research failed:", err));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Discovery API Route Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}