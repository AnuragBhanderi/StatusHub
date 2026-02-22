// Maps a ServiceStatus to the event type key used in threshold strings
const STATUS_TO_EVENT: Record<string, string> = {
  DEGRADED: "degraded",
  PARTIAL_OUTAGE: "partial_outage",
  MAJOR_OUTAGE: "major_outage",
  MAINTENANCE: "maintenance",
};

// Backward-compatible: legacy presets → comma-separated event types
function parseThreshold(threshold: string): Set<string> {
  switch (threshold) {
    case "all":
      return new Set(["degraded", "partial_outage", "major_outage", "maintenance", "recovery"]);
    case "outages_only":
      return new Set(["partial_outage", "major_outage", "recovery"]);
    case "major_only":
      return new Set(["major_outage", "recovery"]);
    default:
      // New format: comma-separated event types
      return new Set(threshold.split(",").filter(Boolean));
  }
}

export function meetsThreshold(
  newStatus: string,
  threshold: string,
  oldStatus?: string
): boolean {
  const allowed = parseThreshold(threshold);

  // Recovery: service came back to operational
  if (newStatus === "OPERATIONAL" && oldStatus) {
    const oldEvent = STATUS_TO_EVENT[oldStatus];
    // Send recovery if user has "recovery" enabled AND cared about the original incident
    return allowed.has("recovery") && !!oldEvent && allowed.has(oldEvent);
  }

  // Escalation / de-escalation: transition between two non-operational states
  // e.g. Degraded → Major Outage, or Major Outage → Partial Outage
  if (oldStatus && oldStatus !== "OPERATIONAL" && newStatus !== "OPERATIONAL") {
    const oldEvent = STATUS_TO_EVENT[oldStatus];
    const newEvent = STATUS_TO_EVENT[newStatus];
    // Send if user cares about either the old or new status
    return (!!newEvent && allowed.has(newEvent)) || (!!oldEvent && allowed.has(oldEvent));
  }

  // Direct incident: operational → bad status
  const newEvent = STATUS_TO_EVENT[newStatus];
  return !!newEvent && allowed.has(newEvent);
}