import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const code = (body.code || "").trim().toUpperCase();

  if (!code) {
    return NextResponse.json({ error: "Promo code is required" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Check if user already has an active paid (non-promo) subscription
  const { data: existingSub } = await admin
    .from("subscriptions")
    .select("plan, status, is_promo")
    .eq("user_id", user.id)
    .single();

  if (existingSub && existingSub.plan === "pro" && !existingSub.is_promo && existingSub.status === "active") {
    return NextResponse.json({ error: "You already have an active Pro subscription" }, { status: 400 });
  }

  // Lookup promo code
  const { data: promo, error: promoError } = await admin
    .from("promo_codes")
    .select("*")
    .eq("code", code)
    .single();

  if (promoError || !promo) {
    return NextResponse.json({ error: "Invalid promo code" }, { status: 400 });
  }

  if (!promo.is_active) {
    return NextResponse.json({ error: "This promo code is no longer active" }, { status: 400 });
  }

  if (promo.current_redemptions >= promo.max_redemptions) {
    return NextResponse.json({ error: "This promo code has reached its redemption limit" }, { status: 400 });
  }

  if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
    return NextResponse.json({ error: "This promo code has expired" }, { status: 400 });
  }

  // Check if user already redeemed this specific code
  if (existingSub && existingSub.is_promo) {
    return NextResponse.json({ error: "You already have an active trial" }, { status: 400 });
  }

  // Calculate trial end date
  const trialEnd = new Date();
  trialEnd.setMonth(trialEnd.getMonth() + promo.duration_months);

  // Increment redemption count
  const { error: incrError } = await admin
    .from("promo_codes")
    .update({ current_redemptions: promo.current_redemptions + 1 })
    .eq("id", promo.id);

  if (incrError) {
    return NextResponse.json({ error: "Failed to redeem code" }, { status: 500 });
  }

  // Upsert subscription
  const { error: subError } = await admin
    .from("subscriptions")
    .upsert(
      {
        user_id: user.id,
        plan: "pro" as const,
        status: "active" as const,
        is_promo: true,
        promo_code: code,
        current_period_end: trialEnd.toISOString(),
        lemon_squeezy_customer_id: null,
        lemon_squeezy_subscription_id: null,
        cancel_at: null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

  if (subError) {
    // Rollback redemption count
    await admin
      .from("promo_codes")
      .update({ current_redemptions: promo.current_redemptions })
      .eq("id", promo.id);
    return NextResponse.json({ error: "Failed to activate trial" }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    plan: "pro",
    trialEndsAt: trialEnd.toISOString(),
    durationMonths: promo.duration_months,
  });
}
