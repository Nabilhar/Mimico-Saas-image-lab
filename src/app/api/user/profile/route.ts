// app/api/user/profile/route.ts
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .rpc('get_user_profile', { p_user_id: userId });

    if (error) {
      console.error("Error fetching user profile:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // RPC returns array, get first item or use defaults
    const profileData = Array.isArray(data) ? data[0] : data;
    
    const userProfile = {
      tier: profileData?.tier || 1,
      credits: profileData?.credits || 0,
      free_text_discovery_used: profileData?.free_text_discovery_used || false,
    };

    return NextResponse.json(userProfile);
  } catch (error: any) {
    console.error("Profile API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}