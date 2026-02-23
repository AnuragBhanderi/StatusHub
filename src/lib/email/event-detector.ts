import type { LiveServiceData } from "@/lib/live-fetch";
import type { IncidentSnapshotEntry } from "@/lib/types/supabase";

export type NotificationEventType =
  | "degraded"
  | "partial_outage"
  | "major_outage"
  | "maintenance"
  | "recovery"
  | "maintenance_completed"
  | "new_incident"
  | "incident_update"
  | "incident_resolved"
  | "incident_escalated"
  | "incident_de_escalated";

export interface DetectedEvent {
  eventType: NotificationEventType;
  serviceSlug: string;
  serviceName: string;
  // Status-level fields
  oldStatus?: string;
  newStatus?: string;
  // Incident-level fields
  incidentId?: string;
  incidentTitle?: string;
  incidentStatus?: string;
  incidentImpact?: string;
  oldImpact?: string;
}

const STATUS_TO_EVENT: Record<string, NotificationEventType> = {
  DEGRADED: "degraded",
  PARTIAL_OUTAGE: "partial_outage",
  MAJOR_OUTAGE: "major_outage",
  MAINTENANCE: "maintenance",
};

const IMPACT_ORDER: Record<string, number> = {
  NONE: 0,
  MINOR: 1,
  MAJOR: 2,
  CRITICAL: 3,
};

// Priority for sorting events (lower = more important)
export const EVENT_PRIORITY: Record<string, number> = {
  major_outage: 0,
  partial_outage: 1,
  incident_escalated: 2,
  new_incident: 3,
  degraded: 4,
  incident_update: 5,
  incident_de_escalated: 6,
  maintenance: 7,
  incident_resolved: 8,
  recovery: 9,
  maintenance_completed: 10,
};

export function detectEvents(
  service: LiveServiceData,
  prevSnapshot: { status: string; incidents_json: IncidentSnapshotEntry[] | null } | null
): DetectedEvent[] {
  const events: DetectedEvent[] = [];
  const oldStatus = prevSnapshot?.status ?? "OPERATIONAL";
  const newStatus = service.currentStatus;

  // ── Status-level detection ──
  if (oldStatus !== newStatus) {
    if (newStatus === "OPERATIONAL") {
      // Something recovered
      if (oldStatus === "MAINTENANCE") {
        events.push({
          eventType: "maintenance_completed",
          serviceSlug: service.slug,
          serviceName: service.name,
          oldStatus,
          newStatus,
        });
      } else {
        events.push({
          eventType: "recovery",
          serviceSlug: service.slug,
          serviceName: service.name,
          oldStatus,
          newStatus,
        });
      }
    } else {
      const eventType = STATUS_TO_EVENT[newStatus];
      if (eventType) {
        events.push({
          eventType,
          serviceSlug: service.slug,
          serviceName: service.name,
          oldStatus,
          newStatus,
        });
      }
    }
  }

  // ── Incident-level detection ──
  // Skip if no previous snapshot or incidents_json was never populated (first run)
  if (!prevSnapshot || prevSnapshot.incidents_json === null) {
    return events;
  }

  const prevMap = new Map<string, IncidentSnapshotEntry>(
    (prevSnapshot.incidents_json ?? []).map((e) => [e.id, e])
  );

  for (const inc of service.activeIncidents) {
    const prev = prevMap.get(inc.id);

    if (!prev) {
      // New incident not seen before
      events.push({
        eventType: "new_incident",
        serviceSlug: service.slug,
        serviceName: service.name,
        incidentId: inc.id,
        incidentTitle: inc.title,
        incidentStatus: inc.status,
        incidentImpact: inc.impact,
      });
      continue;
    }

    // Incident resolved
    if (inc.status === "RESOLVED" && prev.status !== "RESOLVED") {
      events.push({
        eventType: "incident_resolved",
        serviceSlug: service.slug,
        serviceName: service.name,
        incidentId: inc.id,
        incidentTitle: inc.title,
        incidentStatus: inc.status,
        incidentImpact: inc.impact,
      });
      continue;
    }

    // Impact escalated
    const prevSeverity = IMPACT_ORDER[prev.impact] ?? 0;
    const newSeverity = IMPACT_ORDER[inc.impact] ?? 0;

    if (newSeverity > prevSeverity) {
      events.push({
        eventType: "incident_escalated",
        serviceSlug: service.slug,
        serviceName: service.name,
        incidentId: inc.id,
        incidentTitle: inc.title,
        incidentStatus: inc.status,
        incidentImpact: inc.impact,
        oldImpact: prev.impact,
      });
      continue;
    }

    // Impact de-escalated (but not resolved)
    if (newSeverity < prevSeverity && inc.status !== "RESOLVED") {
      events.push({
        eventType: "incident_de_escalated",
        serviceSlug: service.slug,
        serviceName: service.name,
        incidentId: inc.id,
        incidentTitle: inc.title,
        incidentStatus: inc.status,
        incidentImpact: inc.impact,
        oldImpact: prev.impact,
      });
      continue;
    }

    // Incident update (new updates posted)
    if (inc.updateCount > prev.updateCount) {
      events.push({
        eventType: "incident_update",
        serviceSlug: service.slug,
        serviceName: service.name,
        incidentId: inc.id,
        incidentTitle: inc.title,
        incidentStatus: inc.status,
        incidentImpact: inc.impact,
      });
    }
  }

  return events;
}
