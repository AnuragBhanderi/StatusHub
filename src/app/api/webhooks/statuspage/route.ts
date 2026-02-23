import { NextRequest, NextResponse } from "next/server";
import { fetchSingleServiceLive, findServiceConfigByStatusPageUrl } from "@/lib/live-fetch";
import { createAdminClient } from "@/lib/supabase/admin";
import { processServiceEvents } from "@/lib/email/process-service";
import { services as serviceConfigs } from "@/config/services";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  // Auth via query param (Statuspage webhooks can't set custom headers)
  const webhookSecret = process.env.WEBHOOK_SECRET || process.env.CRON_SECRET;
  const querySecret = request.nextUrl.searchParams.get("secret");

  if (!webhookSecret || querySecret !== webhookSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Parse payload and identify service
    let slug: string | null = null;
    let body: Record<string, unknown> = {};

    try {
      body = await request.json();
    } catch {
      // Empty or invalid JSON body — rely on query param
    }

    // Method 1: Match by page.status_url from Statuspage webhook payload
    const page = body?.page as { status_url?: string } | undefined;
    if (page?.status_url) {
      const config = findServiceConfigByStatusPageUrl(page.status_url);
      if (config) slug = config.slug;
    }

    // Method 2: Fallback to ?service=slug query param
    if (!slug) {
      slug = request.nextUrl.searchParams.get("service");
    }

    if (!slug) {
      return NextResponse.json(
        { error: "Could not identify service from webhook payload" },
        { status: 400 }
      );
    }

    // Verify slug exists in our config
    const config = serviceConfigs.find((s) => s.slug === slug);
    if (!config) {
      return NextResponse.json(
        { error: `Unknown service slug: ${slug}` },
        { status: 404 }
      );
    }

    // Fetch fresh data (bypass cache since webhook means something just changed)
    const service = await fetchSingleServiceLive(slug, { bypassCache: true });
    if (!service) {
      return NextResponse.json(
        { error: `Failed to fetch live data for ${slug}` },
        { status: 502 }
      );
    }

    // Process events using shared logic
    const adminClient = createAdminClient();
    const result = await processServiceEvents(adminClient, service, {
      source: "webhook",
    });

    return NextResponse.json({
      service: slug,
      source: "webhook",
      events: result.events.length,
      emailsSent: result.emailsSent,
      detectedEvents: result.events.map((e) => ({
        type: e.eventType,
        ...(e.oldStatus && { from: e.oldStatus }),
        ...(e.newStatus && { to: e.newStatus }),
        ...(e.incidentTitle && { incident: e.incidentTitle }),
      })),
    });
  } catch (err) {
    console.error("Webhook processing error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
