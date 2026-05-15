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
      console.log('[Profile API] ❌ No userId from auth');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log('[Profile API] 🔍 Fetching profile for user:', userId);

    const { data, error } = await supabase
      .rpc('get_user_profile', { p_user_id: userId });

    if (error) {
      console.error('[Profile API] ❌ RPC error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('[Profile API] 📦 Raw RPC data:', data);

    // RPC returns array, get first item or use defaults
    const profileData = Array.isArray(data) ? data[0] : data;
    
    console.log('[Profile API] 📝 Profile data:', profileData);
    
    const userProfile = {
      tier: profileData?.tier || 1,
      credits: profileData?.credits || 0,
      free_text_discovery_used: profileData?.free_text_discovery_used || false,
    };

    console.log('[Profile API] ✅ Returning:', userProfile);

    return NextResponse.json(userProfile);
  } catch (error: any) {
    console.error('[Profile API] ❌ Unexpected error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}