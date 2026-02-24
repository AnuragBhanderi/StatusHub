import { NextRequest, NextResponse } from "next/server";
import { fetchAllServicesLive } from "@/lib/live-fetch";
import { createAdminClient } from "@/lib/supabase/admin";
import { processServiceEvents, flushPendingEvents } from "@/lib/email/process-service";
import type { PreloadedContext } from "@/lib/email/process-service";
import type { IncidentSnapshotEntry } from "@/lib/types/supabase";
import { resolvePlanFromRow, getPlanLimits } from "@/lib/subscription";

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

    // Build stack map from projects, filtered by plan limits
    // Users on free plan only get emails for default project's first N services
    const [projectsResult, subsResult] = await Promise.all([
      adminClient.from("projects").select("user_id, service_slugs, is_default"),
      adminClient.from("subscriptions").select("user_id, plan, status, current_period_end, is_promo"),
    ]);

    const allProjects = projectsResult.data || [];
    const allSubs = subsResult.data || [];

    // Build plan map: user_id → resolved plan
    const planMap = new Map<string, "free" | "pro">();
    for (const sub of allSubs) {
      planMap.set(sub.user_id, resolvePlanFromRow(sub));
    }

    // Group projects by user
    const userProjectsMap = new Map<string, typeof allProjects>();
    for (const p of allProjects) {
      const proj = p as { user_id: string; service_slugs: string[]; is_default: boolean };
      const existing = userProjectsMap.get(proj.user_id) || [];
      existing.push(proj);
      userProjectsMap.set(proj.user_id, existing);
    }

    // Build plan-aware stackMap
    const stackMap = new Map<string, Set<string>>();
    for (const [userId, userProjects] of userProjectsMap) {
      const plan = planMap.get(userId) || "free";
      const limits = getPlanLimits(plan);
      const eligible = new Set<string>();

      // Sort: default project first
      const sorted = [...userProjects].sort((a, b) =>
        a.is_default ? -1 : b.is_default ? 1 : 0
      );

      let projectCount = 0;
      for (const proj of sorted) {
        projectCount++;
        if (projectCount > limits.maxProjects) break;
        const slugs = (proj.service_slugs || []).slice(0, limits.maxServicesPerProject);
        for (const slug of slugs) eligible.add(slug);
      }

      stackMap.set(userId, eligible);
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
