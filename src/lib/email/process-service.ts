import type { SupabaseClient } from "@supabase/supabase-js";
import type { LiveServiceData } from "@/lib/live-fetch";
import { getTransporter } from "@/lib/email/transporter";
import { notificationEmail } from "@/lib/email/templates";
import type { NotificationEmailParams } from "@/lib/email/templates";
import { shouldSendEmail } from "@/lib/email/rate-limiter";
import { shouldNotifyForEvent } from "@/lib/email/severity-filter";
import { detectEvents, EVENT_PRIORITY } from "@/lib/email/event-detector";
import type { DetectedEvent } from "@/lib/email/event-detector";
import type { IncidentSnapshotEntry } from "@/lib/types/supabase";

export interface PreloadedContext {
  snapshotMap: Map<string, { status: string; incidents_json: IncidentSnapshotEntry[] | null }>;
  allPrefs: { user_id: string; email_address: string | null; severity_threshold: string }[];
  stackMap: Map<string, Set<string>>;
}

export interface ProcessServiceResult {
  events: DetectedEvent[];
  emailsSent: number;
}

export async function processServiceEvents(
  adminClient: SupabaseClient,
  service: LiveServiceData,
  opts: { source: "webhook" | "poll"; preloaded?: PreloadedContext }
): Promise<ProcessServiceResult> {
  // 1. Load previous snapshot
  let prevSnapshot: { status: string; incidents_json: IncidentSnapshotEntry[] | null } | null = null;

  if (opts.preloaded) {
    prevSnapshot = opts.preloaded.snapshotMap.get(service.slug) ?? null;
  } else {
    const { data: snapshot } = await adminClient
      .from("service_status_snapshots")
      .select("service_slug, status, incidents_json")
      .eq("service_slug", service.slug)
      .single();
    if (snapshot) {
      prevSnapshot = { status: snapshot.status, incidents_json: snapshot.incidents_json };
    }
  }

  // 2. Detect events and sort by priority
  const events = detectEvents(service, prevSnapshot);
  events.sort((a, b) => (EVENT_PRIORITY[a.eventType] ?? 99) - (EVENT_PRIORITY[b.eventType] ?? 99));

  // 3. Send emails if events detected
  let emailsSent = 0;

  if (events.length > 0) {
    let allPrefs: { user_id: string; email_address: string | null; severity_threshold: string }[];
    let stackMap: Map<string, Set<string>>;

    if (opts.preloaded) {
      allPrefs = opts.preloaded.allPrefs;
      stackMap = opts.preloaded.stackMap;
    } else {
      const { data: prefs } = await adminClient
        .from("notification_preferences")
        .select("user_id, email_enabled, email_address, severity_threshold")
        .eq("email_enabled", true);
      allPrefs = (prefs || []) as typeof allPrefs;

      const { data: userPrefs } = await adminClient
        .from("user_preferences")
        .select("user_id, my_stack");
      stackMap = new Map(
        (userPrefs || []).map((p: { user_id: string; my_stack: string[] }) => [p.user_id, new Set(p.my_stack)])
      );
    }

    const transporter = getTransporter();
    const statusHubUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://statushub-seven.vercel.app";

    for (const event of events) {
      for (const pref of allPrefs) {
        const userStack = stackMap.get(pref.user_id);
        if (!userStack || !userStack.has(event.serviceSlug)) continue;
        if (!shouldNotifyForEvent(event.eventType, pref.severity_threshold || "all")) continue;
        if (!pref.email_address) continue;

        const canSend = await shouldSendEmail(adminClient, pref.user_id, event.serviceSlug);
        if (!canSend) continue;

        const emailParams = buildEmailParams(event, statusHubUrl);
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

  // 4. Upsert snapshot
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

  return { events, emailsSent };
}

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
