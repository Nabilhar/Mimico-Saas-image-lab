// app/api/user/credits/deduct/route.ts
import { NextResponse } from "next/server";
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

    const { amount, reason, business_id, metadata } = await req.json();

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "Invalid amount" }, 
        { status: 400 }
      );
    }

    if (!reason) {
      return NextResponse.json(
        { error: "Reason is required" }, 
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .rpc('deduct_credits', {
        p_user_id: userId,
        p_amount: amount,
        p_reason: reason,
        p_business_id: business_id || null,
        p_metadata: metadata || {}
      });

    if (error) {
      console.error("Error deducting credits:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Parse the JSON response from the function
    const result = typeof data === 'string' ? JSON.parse(data) : data;

    if (!result.success) {
      return NextResponse.json(
        { error: result.message, current_credits: result.current_credits }, 
        { status: 400 }
      );
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Deduct credits API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}