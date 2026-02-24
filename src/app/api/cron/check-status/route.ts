import { NextRequest, NextResponse } from "next/server";
import { fetchAllServicesLive } from "@/lib/live-fetch";
import { createAdminClient } from "@/lib/supabase/admin";
import { processServiceEvents, flushPendingEvents } from "@/lib/email/process-service";
import type { PreloadedContext } from "@/lib/email/process-service";
import type { IncidentSnapshotEntry } from "@/lib/types/supabase";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  // Verify cron secret — supports both header and query param (for cron-job.org)
  const authHeader = request.headers.get("authorization");
  const querySecret = request.nextUrl.searchParams.get("secret");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || (authHeader !== `Bearer ${cronSecret}` && querySecret !== cronSecret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const adminClient = createAdminClient();
    const services = await fetchAllServicesLive();

    // Preload all data upfront (3 bulk queries instead of N per-service queries)
    const { data: snapshots } = await adminClient
      .from("service_status_snapshots")
      .select("*");

    const snapshotMap = new Map(
      (snapshots || []).map((s: { service_slug: string; status: string; incidents_json: IncidentSnapshotEntry[] | null }) => [
        s.service_slug,
        { status: s.status, incidents_json: s.incidents_json },
      ])
    );

    const { data: allPrefs } = await adminClient
      .from("notification_preferences")
      .select("user_id, email_enabled, email_address, severity_threshold")
      .eq("email_enabled", true);

    // Build stack map from projects (union of all service_slugs per user)
    const { data: allProjects } = await adminClient
      .from("projects")
      .select("user_id, service_slugs");

    const stackMap = new Map<string, Set<string>>();
    for (const p of allProjects || []) {
      const proj = p as { user_id: string; service_slugs: string[] };
      const existing = stackMap.get(proj.user_id) || new Set<string>();
      for (const slug of proj.service_slugs || []) existing.add(slug);
      stackMap.set(proj.user_id, existing);
    }

    const preloaded: PreloadedContext = {
      snapshotMap,
      allPrefs: (allPrefs || []) as PreloadedContext["allPrefs"],
      stackMap,
    };

    // Process each service using shared logic
    let totalEvents = 0;
    let totalEmailsSent = 0;
    const allDetected: { slug: string; type: string; from?: string; to?: string; incident?: string }[] = [];

    for (const service of services) {
      const result = await processServiceEvents(adminClient, service, {
        source: "poll",
        preloaded,
      });

      totalEvents += result.events.length;
      totalEmailsSent += result.emailsSent;

      for (const e of result.events) {
        allDetected.push({
          slug: e.serviceSlug,
          type: e.eventType,
          ...(e.oldStatus && { from: e.oldStatus }),
          ...(e.newStatus && { to: e.newStatus }),
          ...(e.incidentTitle && { incident: e.incidentTitle }),
        });
      }
    }

    // Flush any pending notifications that were rate-limited in previous runs
    const pendingFlushed = await flushPendingEvents(adminClient, preloaded.allPrefs);

    return NextResponse.json({
      checked: services.length,
      events: totalEvents,
      emailsSent: totalEmailsSent,
      pendingFlushed,
      source: "poll",
      detectedEvents: allDetected,
    });
  } catch (err) {
    console.error("Cron check-status error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
