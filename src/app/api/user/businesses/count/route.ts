// app/api/user/businesses/count/route.ts
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
      .rpc('count_user_businesses', { p_user_id: userId });

    if (error) {
      console.error("Error counting businesses:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ count: data || 0 });
  } catch (error: any) {
    console.error("Count businesses API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}