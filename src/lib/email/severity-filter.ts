export function meetsThreshold(
  newStatus: string,
  threshold: string
): boolean {
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
