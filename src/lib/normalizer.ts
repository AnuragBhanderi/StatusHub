export type ServiceStatus =
  | "OPERATIONAL"
  | "DEGRADED"
  | "PARTIAL_OUTAGE"
  | "MAJOR_OUTAGE"
  | "MAINTENANCE"
  | "UNKNOWN";

export type IncidentImpact = "NONE" | "MINOR" | "MAJOR" | "CRITICAL";

export type IncidentStatus =
  | "INVESTIGATING"
  | "IDENTIFIED"
  | "MONITORING"
  | "RESOLVED"
  | "POSTMORTEM";

export function mapStatuspageIndicator(indicator: string): ServiceStatus {
  switch (indicator) {
    case "none":
      return "OPERATIONAL";
    case "minor":
      return "DEGRADED";
    case "major":
      return "PARTIAL_OUTAGE";
    case "critical":
      return "MAJOR_OUTAGE";
    case "maintenance":
      return "MAINTENANCE";
    default:
      return "UNKNOWN";
  }
}

export function mapIncidentImpact(impact: string): IncidentImpact {
  switch (impact) {
    case "none":
      return "NONE";
    case "minor":
      return "MINOR";
    case "major":
      return "MAJOR";
    case "critical":
      return "CRITICAL";
    default:
      return "NONE";
  }
}

export function mapIncidentStatus(status: string): IncidentStatus {
  switch (status) {
    case "investigating":
      return "INVESTIGATING";
    case "identified":
      return "IDENTIFIED";
    case "monitoring":
      return "MONITORING";
    case "resolved":
      return "RESOLVED";
    case "postmortem":
      return "POSTMORTEM";
    default:
      return "INVESTIGATING";
  }
}

export const STATUS_DISPLAY: Record<
  string,
  { label: string; color: string; order: number }
> = {
  OPERATIONAL: { label: "Operational", color: "#3ddc84", order: 4 },
  DEGRADED: { label: "Degraded", color: "#ffd54f", order: 2 },
  PARTIAL_OUTAGE: { label: "Partial Outage", color: "#ffab40", order: 1 },
  MAJOR_OUTAGE: { label: "Major Outage", color: "#ff5252", order: 0 },
  MAINTENANCE: { label: "Maintenance", color: "#448aff", order: 3 },
  UNKNOWN: { label: "Unknown", color: "#9e9e9e", order: 5 },
};

export const IMPACT_DISPLAY: Record<string, { label: string; color: string }> =
  {
    NONE: { label: "None", color: "#9e9e9e" },
    MINOR: { label: "Minor", color: "#ffd54f" },
    MAJOR: { label: "Major", color: "#ffab40" },
    CRITICAL: { label: "Critical", color: "#ff5252" },
  };
