// app/api/webhooks/clerk/route.ts
// Handles Clerk webhook events. Currently: user.created → create profiles row + grant welcome credits.

import { NextResponse } from "next/server";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { Webhook } = require("svix");
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[Clerk Webhook] ❌ CLERK_WEBHOOK_SECRET is not set");
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  // Verify signature
  const payload = await req.text();
  const headers = {
    "svix-id":        req.headers.get("svix-id") ?? "",
    "svix-timestamp": req.headers.get("svix-timestamp") ?? "",
    "svix-signature": req.headers.get("svix-signature") ?? "",
  };

  let event: any;
  try {
    const wh = new Webhook(secret);
    event = wh.verify(payload, headers);
  } catch (err) {
    console.error("[Clerk Webhook] ❌ Signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Only handle user.created
  if (event.type !== "user.created") {
    return NextResponse.json({ received: true });
  }

  const { id: userId, email_addresses, first_name, last_name } = event.data;
  const email = email_addresses?.[0]?.email_address ?? null;

  console.log(`[Clerk Webhook] 👤 New user: ${userId} (${email})`);

  // Insert profiles row directly using service role (bypasses JWT-dependent RPCs).
  // Sets 25 welcome credits and marks welcome_credits_claimed upfront.
  const { error } = await supabase.from("profiles").insert({
    id: userId,
    email,
    first_name: first_name ?? null,
    last_name: last_name ?? null,
    tier: 1,
    credits: 0,
    welcome_credits_claimed: false,
    free_text_discovery_used: false,
  });

  if (error) {
    // Conflict = row already exists (e.g. duplicate webhook delivery) — safe to ignore
    if (error.code === "23505") {
      console.log(`[Clerk Webhook] ⚠️ profiles row already exists for ${userId} — skipping`);
      return NextResponse.json({ success: true });
    }
    console.error("[Clerk Webhook] ❌ Failed to insert profiles row:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  console.log(`[Clerk Webhook] ✅ profiles row created for ${userId} (credits granted after profile save)`);
  return NextResponse.json({ success: true });
}
