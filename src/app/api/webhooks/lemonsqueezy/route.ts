import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

interface LSWebhookPayload {
  meta: {
    event_name: string;
    custom_data?: { user_id?: string };
  };
  data: {
    id: string;
    attributes: {
      customer_id: number;
      status: string;
      renews_at: string | null;
      ends_at: string | null;
      variant_id: number;
    };
  };
}

function verifySignature(rawBody: string, signature: string, secret: string): boolean {
  const hmac = crypto.createHmac("sha256", secret);
  const digest = hmac.update(rawBody).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
  } catch {
    return false;
  }
}

function mapStatus(lsStatus: string): string {
  switch (lsStatus) {
    case "active":
    case "on_trial":
      return "active";
    case "cancelled":
      return "cancelled";
    case "past_due":
    case "unpaid":
      return "past_due";
    case "expired":
      return "expired";
    case "paused":
      return "paused";
    default:
      return "active";
  }
}

export async function POST(request: NextRequest) {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  if (!secret) {
    console.error("LEMONSQUEEZY_WEBHOOK_SECRET not set");
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get("x-signature") || "";

  if (!verifySignature(rawBody, signature, secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const payload: LSWebhookPayload = JSON.parse(rawBody);
  const eventName = payload.meta.event_name;
  const userId = payload.meta.custom_data?.user_id;
  const attrs = payload.data.attributes;
  const lsSubId = payload.data.id;
  const lsCustomerId = String(attrs.customer_id);

  if (!userId) {
    console.error("No user_id in custom_data for LS event:", eventName);
    return NextResponse.json({ error: "Missing user_id" }, { status: 400 });
  }

  const adminClient = createAdminClient();

  const isExpired = eventName === "subscription_expired";

  await adminClient.from("subscriptions").upsert(
    {
      user_id: userId,
      lemon_squeezy_customer_id: lsCustomerId,
      lemon_squeezy_subscription_id: lsSubId,
      plan: isExpired ? "free" : "pro",
      status: isExpired ? "expired" : mapStatus(attrs.status),
      current_period_end: attrs.renews_at || attrs.ends_at || null,
      cancel_at: attrs.ends_at || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  return NextResponse.json({ received: true });
}
