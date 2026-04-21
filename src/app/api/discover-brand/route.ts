import { NextResponse } from "next/server";
import { discoverAndSaveBrandIdentity } from "@/lib/brandDiscovery";

export async function POST(req: Request) {
  try {
    const { business_id, business_name, address } = await req.json();

    console.log(`🚀 [Discovery API] Starting background research for ${business_name}`);

    // Trigger research (no await so response is instant)
    discoverAndSaveBrandIdentity(business_id, business_name, address)
      .then(() => console.log(`✅ [Discovery API] Research complete for ${business_name}`))
      .catch(err => console.error("❌ [Discovery API] Research failed:", err));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Discovery API Route Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}