// app/api/user/claim-welcome-credits/route.ts
// Called after the user saves their business profile (country is now known).
// Grants 25 welcome credits if: country is Canada or USA, and not already claimed.

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

const ELIGIBLE_COUNTRIES = ["Canada", "USA"];
const WELCOME_CREDITS = 25;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { country } = await req.json();

  // Country check
  if (!ELIGIBLE_COUNTRIES.includes(country)) {
    return NextResponse.json({
      success: false,
      message: "Welcome credits are only available for Canadian and US businesses.",
    });
  }

  // Fetch current profile state
  const { data: profile, error: fetchError } = await supabase
    .from("profiles")
    .select("credits, welcome_credits_claimed")
    .eq("id", userId)
    .single();

  if (fetchError || !profile) {
    console.error("[claim-welcome-credits] ❌ Profile not found:", fetchError);
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  if (profile.welcome_credits_claimed) {
    return NextResponse.json({
      success: false,
      message: "Welcome credits already claimed.",
    });
  }

  // Grant credits
  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      credits: profile.credits + WELCOME_CREDITS,
      welcome_credits_claimed: true,
    })
    .eq("id", userId);

  if (updateError) {
    console.error("[claim-welcome-credits] ❌ Update failed:", updateError);
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  console.log(`[claim-welcome-credits] ✅ ${WELCOME_CREDITS} credits granted to ${userId} (${country})`);
  return NextResponse.json({
    success: true,
    credits_granted: WELCOME_CREDITS,
    new_total: profile.credits + WELCOME_CREDITS,
  });
}
