import type { NotificationEventType } from "./event-detector";

const ALL_EVENT_TYPES: NotificationEventType[] = [
  "degraded",
  "partial_outage",
  "major_outage",
  "maintenance",
  "recovery",
  "maintenance_completed",
  "new_incident",
  "incident_update",
  "incident_resolved",
  "incident_escalated",
  "incident_de_escalated",
];

// Backward-compatible: legacy presets → full event type sets
function parseThreshold(threshold: string): Set<string> {
  switch (threshold) {
    case "all":
      return new Set(ALL_EVENT_TYPES);
    case "outages_only":
      return new Set([
        "partial_outage",
        "major_outage",
        "recovery",
        "new_incident",
        "incident_resolved",
        "incident_escalated",
        "incident_de_escalated",
      ]);
    case "major_only":
      return new Set([
        "major_outage",
        "recovery",
        "incident_escalated",
        "incident_resolved",
      ]);
    default:
      // New format: comma-separated event types
      return new Set(threshold.split(",").filter(Boolean));
  }
}

/**
 * Check if a specific event type should trigger a notification
 * based on the user's threshold preference.
 */
export function shouldNotifyForEvent(
  eventType: NotificationEventType,
  threshold: string
): boolean {
  const allowed = parseThreshold(threshold);
  return allowed.has(eventType);
}

// ── Deprecated: kept for backward compatibility ──

const STATUS_TO_EVENT: Record<string, string> = {
  DEGRADED: "degraded",
  PARTIAL_OUTAGE: "partial_outage",
  MAJOR_OUTAGE: "major_outage",
  MAINTENANCE: "maintenance",
};

export function meetsThreshold(
  newStatus: string,
  threshold: string,
  oldStatus?: string
): boolean {
  const allowed = parseThreshold(threshold);

  // Recovery: service came back to operational
  if (newStatus === "OPERATIONAL" && oldStatus) {
    if (oldStatus === "MAINTENANCE") {
      return allowed.has("maintenance_completed");
    }
    const oldEvent = STATUS_TO_EVENT[oldStatus];
    return allowed.has("recovery") && !!oldEvent && allowed.has(oldEvent);
  }

  // Escalation / de-escalation
  if (oldStatus && oldStatus !== "OPERATIONAL" && newStatus !== "OPERATIONAL") {
    const oldEvent = STATUS_TO_EVENT[oldStatus];
    const newEvent = STATUS_TO_EVENT[newStatus];
    return (!!newEvent && allowed.has(newEvent)) || (!!oldEvent && allowed.has(oldEvent));
  }

  // Direct incident
  const newEvent = STATUS_TO_EVENT[newStatus];
  return !!newEvent && allowed.has(newEvent);
}
