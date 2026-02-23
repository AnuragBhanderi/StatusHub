import { NextRequest, NextResponse } from "next/server";
import { fetchAllServicesLive } from "@/lib/live-fetch";
import { createAdminClient } from "@/lib/supabase/admin";
import { getTransporter } from "@/lib/email/transporter";
import { notificationEmail } from "@/lib/email/templates";
import type { NotificationEmailParams } from "@/lib/email/templates";
import { shouldSendEmail } from "@/lib/email/rate-limiter";
import { shouldNotifyForEvent } from "@/lib/email/severity-filter";
import { detectEvents, EVENT_PRIORITY } from "@/lib/email/event-detector";
import type { DetectedEvent } from "@/lib/email/event-detector";
import type { IncidentSnapshotEntry } from "@/lib/types/supabase";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const adminClient = createAdminClient();
    const services = await fetchAllServicesLive();

    // Load previous snapshots
    const { data: snapshots } = await adminClient
      .from("service_status_snapshots")
      .select("*");

    const snapshotMap = new Map(
      (snapshots || []).map((s: { service_slug: string; status: string; incident_title: string | null; incidents_json: IncidentSnapshotEntry[] | null }) => [s.service_slug, s])
    );

    // Detect all events (status + incident) using event detector
    const allEvents: DetectedEvent[] = [];
    for (const service of services) {
      const prev = snapshotMap.get(service.slug) as { status: string; incidents_json: IncidentSnapshotEntry[] | null } | undefined;
      const events = detectEvents(service, prev ?? null);
      allEvents.push(...events);
    }

    // Sort by priority (most important first — wins rate limit slot)
    allEvents.sort((a, b) => (EVENT_PRIORITY[a.eventType] ?? 99) - (EVENT_PRIORITY[b.eventType] ?? 99));

    let emailsSent = 0;

    if (allEvents.length > 0) {
      // Get all users with email alerts enabled
      const { data: allPrefs } = await adminClient
        .from("notification_preferences")
        .select("user_id, email_enabled, email_address, severity_threshold")
        .eq("email_enabled", true);

      // Get all users' my_stack preferences
      const { data: allUserPrefs } = await adminClient
        .from("user_preferences")
        .select("user_id, my_stack");

      const stackMap = new Map(
        (allUserPrefs || []).map((p: { user_id: string; my_stack: string[] }) => [p.user_id, new Set(p.my_stack)])
      );

      const transporter = getTransporter();
      const statusHubUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://statushub-seven.vercel.app";

      for (const event of allEvents) {
        for (const pref of allPrefs || []) {
          // Check if service is in user's stack
          const userStack = stackMap.get(pref.user_id);
          if (!userStack || !userStack.has(event.serviceSlug)) continue;

          // Check event type filter
          if (!shouldNotifyForEvent(event.eventType, pref.severity_threshold || "all")) continue;

          // Check email address exists
          if (!pref.email_address) continue;

          // Check rate limit
          const canSend = await shouldSendEmail(adminClient, pref.user_id, event.serviceSlug);
          if (!canSend) continue;

          // Build email params
          const emailParams = buildEmailParams(event, statusHubUrl);

          // Send email
          const { subject, html, text } = notificationEmail(emailParams);

          try {
            await transporter.sendMail({
              from: process.env.SMTP_FROM || "StatusHub <alerts@statushub.dev>",
              to: pref.email_address,
              subject,
              html,
              text,
              headers: {
                "List-Unsubscribe": `<${statusHubUrl}>`,
                "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
              },
            });

            // Log the sent email with event type
            await adminClient.from("email_alert_log").insert({
              user_id: pref.user_id,
              service_slug: event.serviceSlug,
              old_status: event.oldStatus || event.incidentImpact || "",
              new_status: event.newStatus || event.eventType,
              event_type: event.eventType,
            });

            emailsSent++;
          } catch (err) {
            console.error(`Failed to send email to ${pref.email_address}:`, err);
          }
        }
      }
    }

    // Upsert all current snapshots WITH incident data
    for (const service of services) {
      const incidentsSnapshot: IncidentSnapshotEntry[] = service.activeIncidents.map((i) => ({
        id: i.id,
        status: i.status,
        impact: i.impact,
        updateCount: i.updateCount,
      }));

      await adminClient
        .from("service_status_snapshots")
        .upsert(
          {
            service_slug: service.slug,
            status: service.currentStatus,
            incident_title: service.latestIncident?.title || null,
            incidents_json: incidentsSnapshot,
            snapshot_at: new Date().toISOString(),
          },
          { onConflict: "service_slug" }
        );
    }

    return NextResponse.json({
      checked: services.length,
      events: allEvents.length,
      emailsSent,
      detectedEvents: allEvents.map((e) => ({
        slug: e.serviceSlug,
        type: e.eventType,
        ...(e.oldStatus && { from: e.oldStatus }),
        ...(e.newStatus && { to: e.newStatus }),
        ...(e.incidentTitle && { incident: e.incidentTitle }),
      })),
    });
  } catch (err) {
    console.error("Cron check-status error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Map DetectedEvent to NotificationEmailParams
function buildEmailParams(event: DetectedEvent, statusHubUrl: string): NotificationEmailParams {
  const statusEventTypes = new Set(["degraded", "partial_outage", "major_outage", "maintenance", "recovery", "maintenance_completed"]);

  if (statusEventTypes.has(event.eventType)) {
    return {
      eventType: event.eventType as "degraded" | "partial_outage" | "major_outage" | "maintenance" | "recovery" | "maintenance_completed",
      serviceName: event.serviceName,
      serviceSlug: event.serviceSlug,
      oldStatus: event.oldStatus || "OPERATIONAL",
      newStatus: event.newStatus || "UNKNOWN",
      incidentTitle: event.incidentTitle,
      statusHubUrl,
    };
  }

  return {
    eventType: event.eventType as "new_incident" | "incident_update" | "incident_resolved" | "incident_escalated" | "incident_de_escalated",
    serviceName: event.serviceName,
    serviceSlug: event.serviceSlug,
    incidentTitle: event.incidentTitle || "Unknown incident",
    incidentImpact: event.incidentImpact || "NONE",
    oldImpact: event.oldImpact,
    statusHubUrl,
  };
}
