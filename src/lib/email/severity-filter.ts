export function meetsThreshold(
  newStatus: string,
  threshold: string,
  oldStatus?: string
): boolean {
  // Always notify when a service recovers back to operational,
  // as long as the previous status would have triggered a notification
  if (newStatus === "OPERATIONAL" && oldStatus) {
    return meetsThreshold(oldStatus, threshold);
  }

  switch (threshold) {
    case "all":
      return ["DEGRADED", "PARTIAL_OUTAGE", "MAJOR_OUTAGE", "MAINTENANCE"].includes(newStatus);
    case "outages_only":
      return ["PARTIAL_OUTAGE", "MAJOR_OUTAGE"].includes(newStatus);
    case "major_only":
      return newStatus === "MAJOR_OUTAGE";
    default:
      return false;
  }
}
