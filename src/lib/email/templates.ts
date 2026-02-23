import { STATUS_DISPLAY, IMPACT_DISPLAY } from "@/lib/normalizer";
import type { NotificationEventType } from "./event-detector";

// ── Shared constants ──

const STATUS_EMOJI: Record<string, string> = {
  OPERATIONAL: "\u2705",
  DEGRADED: "\u26a0\ufe0f",
  PARTIAL_OUTAGE: "\ud83d\udfe0",
  MAJOR_OUTAGE: "\ud83d\udd34",
  MAINTENANCE: "\ud83d\udd27",
  UNKNOWN: "\u2753",
};

const EVENT_EMOJI: Record<NotificationEventType, string> = {
  major_outage: "\ud83d\udd34",
  partial_outage: "\ud83d\udfe0",
  degraded: "\u26a0\ufe0f",
  maintenance: "\ud83d\udd27",
  recovery: "\u2705",
  maintenance_completed: "\u2705",
  new_incident: "\ud83d\udea8",
  incident_update: "\ud83d\udcdd",
  incident_resolved: "\u2705",
  incident_escalated: "\u2b06\ufe0f",
  incident_de_escalated: "\u2b07\ufe0f",
};

const EVENT_LABEL: Record<NotificationEventType, string> = {
  major_outage: "Major Outage Detected",
  partial_outage: "Partial Outage Detected",
  degraded: "Degraded Performance",
  maintenance: "Scheduled Maintenance",
  recovery: "Service Recovered",
  maintenance_completed: "Maintenance Completed",
  new_incident: "New Incident",
  incident_update: "Incident Update",
  incident_resolved: "Incident Resolved",
  incident_escalated: "Incident Escalated",
  incident_de_escalated: "Incident De-escalated",
};

// ── Params types ──

interface StatusChangeParams {
  eventType: "degraded" | "partial_outage" | "major_outage" | "maintenance" | "recovery" | "maintenance_completed";
  serviceName: string;
  serviceSlug: string;
  oldStatus: string;
  newStatus: string;
  incidentTitle?: string | null;
  statusHubUrl: string;
}

interface IncidentEventParams {
  eventType: "new_incident" | "incident_update" | "incident_resolved" | "incident_escalated" | "incident_de_escalated";
  serviceName: string;
  serviceSlug: string;
  incidentTitle: string;
  incidentImpact: string;
  oldImpact?: string;
  statusHubUrl: string;
}

export type NotificationEmailParams = StatusChangeParams | IncidentEventParams;

// ── Helpers ──

function timestamp(): string {
  return new Date().toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function isStatusEvent(p: NotificationEmailParams): p is StatusChangeParams {
  return "oldStatus" in p;
}

function accentColorForEvent(params: NotificationEmailParams): string {
  if (isStatusEvent(params)) {
    const display = STATUS_DISPLAY[params.newStatus];
    return display?.color ?? "#6366f1";
  }
  // Incident events
  switch (params.eventType) {
    case "new_incident":
    case "incident_escalated":
      return IMPACT_DISPLAY[params.incidentImpact]?.color ?? "#ef4444";
    case "incident_resolved":
      return "#16a34a";
    case "incident_de_escalated":
      return "#22c55e";
    case "incident_update":
      return "#f59e0b";
    default:
      return "#6366f1";
  }
}

function isPositiveEvent(eventType: NotificationEventType): boolean {
  return eventType === "recovery" || eventType === "maintenance_completed" || eventType === "incident_resolved" || eventType === "incident_de_escalated";
}

// ── Email shell (shared outer wrapper) ──

function emailShell(opts: {
  headerGradient: string;
  ts: string;
  sectionLabel: string;
  serviceName: string;
  contentHtml: string;
  serviceUrl: string;
  settingsUrl: string;
}): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
</head>
<body style="margin:0;padding:0;background:#f0f0f3;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f0f0f3;padding:40px 16px;">
    <tr><td align="center">

      <!-- Outer card -->
      <table width="560" cellpadding="0" cellspacing="0" role="presentation" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08),0 8px 24px rgba(0,0,0,0.04);">

        <!-- Header -->
        <tr><td style="background:${opts.headerGradient};padding:24px 28px;">
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
            <tr>
              <td>
                <span style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.5px;">StatusHub</span>
                <span style="color:rgba(255,255,255,0.7);font-size:12px;font-weight:500;margin-left:8px;">Alerts</span>
              </td>
              <td align="right">
                <span style="color:rgba(255,255,255,0.8);font-size:12px;font-weight:500;">${opts.ts}</span>
              </td>
            </tr>
          </table>
        </td></tr>

        <!-- Title section -->
        <tr><td style="padding:28px 28px 0;">
          <p style="margin:0 0 4px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#a1a1aa;">
            ${opts.sectionLabel}
          </p>
          <p style="margin:0;font-size:20px;font-weight:700;color:#18181b;letter-spacing:-0.3px;">
            ${opts.serviceName}
          </p>
        </td></tr>

        <!-- Content -->
        ${opts.contentHtml}

        <!-- CTA Button -->
        <tr><td style="padding:0 28px 28px;">
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
            <tr><td align="center">
              <a href="${opts.serviceUrl}" style="display:inline-block;background:#18181b;color:#ffffff;text-decoration:none;padding:12px 32px;border-radius:10px;font-size:14px;font-weight:600;letter-spacing:-0.2px;">
                View Full Details on StatusHub &rarr;
              </a>
            </td></tr>
          </table>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:20px 28px;border-top:1px solid #f0f0f3;background:#fafafa;">
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
            <tr>
              <td>
                <p style="margin:0 0 6px;font-size:11px;color:#a1a1aa;line-height:1.5;">
                  You're receiving this because <strong>${opts.serviceName}</strong> is in your StatusHub stack.
                </p>
                <p style="margin:0;font-size:11px;">
                  <a href="${opts.settingsUrl}" style="color:#6366f1;text-decoration:none;font-weight:500;">Manage notifications</a>
                  <span style="color:#d4d4d8;margin:0 6px;">&middot;</span>
                  <a href="${opts.settingsUrl}" style="color:#a1a1aa;text-decoration:none;">Unsubscribe</a>
                </p>
              </td>
              <td align="right" style="vertical-align:bottom;">
                <span style="font-size:10px;color:#d4d4d8;font-weight:600;letter-spacing:0.5px;">STATUSHUB</span>
              </td>
            </tr>
          </table>
        </td></tr>

      </table>

    </td></tr>
  </table>
</body>
</html>`;
}

// ── Status change content card ──

function statusChangeContent(params: StatusChangeParams): string {
  const oldDisplay = STATUS_DISPLAY[params.oldStatus] || { label: params.oldStatus, color: "#9e9e9e" };
  const newDisplay = STATUS_DISPLAY[params.newStatus] || { label: params.newStatus, color: "#9e9e9e" };
  const isRecovery = params.eventType === "recovery" || params.eventType === "maintenance_completed";
  const accentColor = newDisplay.color;

  let html = `
        <!-- Timeline -->
        <tr><td style="padding:24px 28px;">
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#fafafa;border-radius:12px;border:1px solid #f0f0f3;">
            <tr><td style="padding:16px 20px 12px;">
              <table cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td style="vertical-align:top;padding-right:14px;">
                    <div style="width:12px;height:12px;border-radius:50%;background:${oldDisplay.color};margin-top:2px;"></div>
                  </td>
                  <td>
                    <p style="margin:0;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;color:#a1a1aa;">Previous</p>
                    <p style="margin:2px 0 0;font-size:15px;font-weight:600;color:${oldDisplay.color};">${oldDisplay.label}</p>
                  </td>
                </tr>
              </table>
            </td></tr>
            <tr><td style="padding:0 20px;">
              <table cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td style="width:12px;text-align:center;">
                    <div style="width:2px;height:20px;background:#e4e4e7;margin:0 auto;"></div>
                  </td>
                  <td style="padding-left:14px;">
                    <div style="width:40px;height:1px;background:#e4e4e7;"></div>
                  </td>
                </tr>
              </table>
            </td></tr>
            <tr><td style="padding:12px 20px 16px;">
              <table cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td style="vertical-align:top;padding-right:14px;">
                    <div style="width:12px;height:12px;border-radius:50%;background:${newDisplay.color};margin-top:2px;box-shadow:0 0 0 4px ${newDisplay.color}20;"></div>
                  </td>
                  <td>
                    <p style="margin:0;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;color:#a1a1aa;">Current</p>
                    <p style="margin:2px 0 0;font-size:15px;font-weight:700;color:${newDisplay.color};">${newDisplay.label}</p>
                  </td>
                </tr>
              </table>
            </td></tr>
          </table>
        </td></tr>`;

  if (params.incidentTitle) {
    html += `
        <tr><td style="padding:0 28px 24px;">
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border-radius:10px;border:1px solid ${accentColor}20;background:${accentColor}08;">
            <tr><td style="padding:14px 18px;">
              <p style="margin:0 0 2px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:${accentColor};">Incident</p>
              <p style="margin:0;font-size:14px;color:#3f3f46;font-weight:500;line-height:1.5;">${params.incidentTitle}</p>
            </td></tr>
          </table>
        </td></tr>`;
  }

  if (isRecovery) {
    const bannerText = params.eventType === "maintenance_completed"
      ? `Maintenance for ${params.serviceName} has completed`
      : `${params.serviceName} is back to normal`;
    const subText = params.eventType === "maintenance_completed"
      ? "All systems operational"
      : "All systems operational";
    html += `
        <tr><td style="padding:0 28px 24px;">
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border-radius:10px;background:linear-gradient(135deg,#f0fdf4,#dcfce7);border:1px solid #bbf7d0;">
            <tr><td style="padding:16px 18px;text-align:center;">
              <p style="margin:0;font-size:15px;font-weight:600;color:#16a34a;">\u2705 ${bannerText}</p>
              <p style="margin:4px 0 0;font-size:12px;color:#4ade80;">${subText}</p>
            </td></tr>
          </table>
        </td></tr>`;
  }

  return html;
}

// ── Incident event content card ──

function incidentContent(params: IncidentEventParams): string {
  const accent = accentColorForEvent(params);
  const impactDisplay = IMPACT_DISPLAY[params.incidentImpact] || { label: params.incidentImpact, color: "#9e9e9e" };

  if (params.eventType === "incident_escalated" || params.eventType === "incident_de_escalated") {
    const oldImpactDisplay = IMPACT_DISPLAY[params.oldImpact ?? "NONE"] || { label: params.oldImpact ?? "None", color: "#9e9e9e" };
    const isEscalation = params.eventType === "incident_escalated";
    const arrow = isEscalation ? "&uarr;" : "&darr;";
    const gradientBg = isEscalation
      ? "linear-gradient(135deg,#fef2f2,#fee2e2)"
      : "linear-gradient(135deg,#f0fdf4,#dcfce7)";
    const borderColor = isEscalation ? "#fecaca" : "#bbf7d0";
    const textColor = isEscalation ? "#ef4444" : "#16a34a";

    return `
        <tr><td style="padding:24px 28px;">
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border-radius:10px;border:1px solid ${accent}20;background:${accent}08;">
            <tr><td style="padding:14px 18px;">
              <p style="margin:0 0 2px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:${accent};">Incident</p>
              <p style="margin:0;font-size:14px;color:#3f3f46;font-weight:500;line-height:1.5;">${params.incidentTitle}</p>
            </td></tr>
          </table>
        </td></tr>
        <tr><td style="padding:0 28px 24px;">
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border-radius:10px;background:${gradientBg};border:1px solid ${borderColor};">
            <tr><td style="padding:16px 18px;text-align:center;">
              <p style="margin:0;font-size:13px;font-weight:600;color:${textColor};">
                ${arrow} Severity changed: <span style="color:${oldImpactDisplay.color};">${oldImpactDisplay.label}</span> &rarr; <span style="color:${impactDisplay.color};">${impactDisplay.label}</span>
              </p>
            </td></tr>
          </table>
        </td></tr>`;
  }

  if (params.eventType === "incident_resolved") {
    return `
        <tr><td style="padding:24px 28px;">
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border-radius:10px;border:1px solid ${accent}20;background:${accent}08;">
            <tr><td style="padding:14px 18px;">
              <p style="margin:0 0 2px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:${accent};">Resolved Incident</p>
              <p style="margin:0;font-size:14px;color:#3f3f46;font-weight:500;line-height:1.5;">${params.incidentTitle}</p>
            </td></tr>
          </table>
        </td></tr>
        <tr><td style="padding:0 28px 24px;">
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border-radius:10px;background:linear-gradient(135deg,#f0fdf4,#dcfce7);border:1px solid #bbf7d0;">
            <tr><td style="padding:16px 18px;text-align:center;">
              <p style="margin:0;font-size:15px;font-weight:600;color:#16a34a;">\u2705 This incident has been resolved</p>
            </td></tr>
          </table>
        </td></tr>`;
  }

  // new_incident or incident_update
  const updateNote = params.eventType === "incident_update"
    ? `<p style="margin:8px 0 0;font-size:12px;color:#a1a1aa;">A new update has been posted for this incident.</p>`
    : "";

  return `
        <tr><td style="padding:24px 28px;">
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border-radius:10px;border:1px solid ${accent}20;background:${accent}08;">
            <tr><td style="padding:14px 18px;">
              <p style="margin:0 0 2px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:${accent};">Incident</p>
              <p style="margin:0;font-size:14px;color:#3f3f46;font-weight:500;line-height:1.5;">${params.incidentTitle}</p>
              <p style="margin:8px 0 0;">
                <span style="display:inline-block;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600;background:${impactDisplay.color}15;color:${impactDisplay.color};border:1px solid ${impactDisplay.color}30;">
                  ${impactDisplay.label}
                </span>
              </p>
              ${updateNote}
            </td></tr>
          </table>
        </td></tr>`;
}

// ── Main factory ──

export function notificationEmail(params: NotificationEmailParams): {
  subject: string;
  html: string;
  text: string;
} {
  const emoji = EVENT_EMOJI[params.eventType];
  const label = EVENT_LABEL[params.eventType];
  const ts = timestamp();
  const accent = accentColorForEvent(params);
  const positive = isPositiveEvent(params.eventType);
  const serviceUrl = `${params.statusHubUrl}?service=${params.serviceSlug}`;
  const settingsUrl = params.statusHubUrl;

  // Subject line
  let subject: string;
  if (isStatusEvent(params)) {
    if (params.eventType === "recovery") {
      subject = `${emoji} ${params.serviceName} is back to Operational`;
    } else if (params.eventType === "maintenance_completed") {
      subject = `${emoji} ${params.serviceName} \u2014 Maintenance Completed`;
    } else {
      const newDisplay = STATUS_DISPLAY[params.newStatus] || { label: params.newStatus };
      subject = `${emoji} ${params.serviceName} \u2014 ${newDisplay.label} Detected`;
    }
  } else {
    switch (params.eventType) {
      case "new_incident":
        subject = `${emoji} ${params.serviceName} \u2014 New Incident: ${params.incidentTitle}`;
        break;
      case "incident_update":
        subject = `${emoji} ${params.serviceName} \u2014 Incident Update: ${params.incidentTitle}`;
        break;
      case "incident_resolved":
        subject = `${emoji} ${params.serviceName} \u2014 Incident Resolved: ${params.incidentTitle}`;
        break;
      case "incident_escalated": {
        const oldLabel = IMPACT_DISPLAY[params.oldImpact ?? "NONE"]?.label ?? params.oldImpact ?? "None";
        const newLabel = IMPACT_DISPLAY[params.incidentImpact]?.label ?? params.incidentImpact;
        subject = `${emoji} ${params.serviceName} \u2014 Escalated: ${oldLabel} \u2192 ${newLabel}`;
        break;
      }
      case "incident_de_escalated": {
        const oldLabel = IMPACT_DISPLAY[params.oldImpact ?? "NONE"]?.label ?? params.oldImpact ?? "None";
        const newLabel = IMPACT_DISPLAY[params.incidentImpact]?.label ?? params.incidentImpact;
        subject = `${emoji} ${params.serviceName} \u2014 De-escalated: ${oldLabel} \u2192 ${newLabel}`;
        break;
      }
    }
  }

  // Header gradient
  const headerGradient = positive
    ? "linear-gradient(135deg, #16a34a, #22c55e)"
    : `linear-gradient(135deg, ${accent}, ${accent}cc)`;

  // Content card
  const contentHtml = isStatusEvent(params)
    ? statusChangeContent(params)
    : incidentContent(params);

  // Full HTML
  const html = emailShell({
    headerGradient,
    ts,
    sectionLabel: isStatusEvent(params) ? "Service Status Update" : "Incident Alert",
    serviceName: params.serviceName,
    contentHtml,
    serviceUrl,
    settingsUrl,
  });

  // Plain text fallback
  let text: string;
  if (isStatusEvent(params)) {
    const oldDisplay = STATUS_DISPLAY[params.oldStatus] || { label: params.oldStatus };
    const newDisplay = STATUS_DISPLAY[params.newStatus] || { label: params.newStatus };
    text = `${emoji} ${subject}

Service: ${params.serviceName}
Status:  ${oldDisplay.label} \u2192 ${newDisplay.label}
Time:    ${ts}
${params.incidentTitle ? `Incident: ${params.incidentTitle}\n` : ""}
View on StatusHub: ${serviceUrl}

---
Manage notifications: ${settingsUrl}`;
  } else {
    const impactLabel = IMPACT_DISPLAY[params.incidentImpact]?.label ?? params.incidentImpact;
    text = `${emoji} ${subject}

Service:  ${params.serviceName}
Incident: ${params.incidentTitle}
Impact:   ${impactLabel}
Time:     ${ts}
${params.oldImpact ? `Previous: ${IMPACT_DISPLAY[params.oldImpact]?.label ?? params.oldImpact}\n` : ""}
View on StatusHub: ${serviceUrl}

---
Manage notifications: ${settingsUrl}`;
  }

  return { subject, html, text };
}

// ── Backward-compatible wrapper ──

interface LegacyStatusChangeParams {
  serviceName: string;
  serviceSlug: string;
  oldStatus: string;
  newStatus: string;
  incidentTitle?: string | null;
  statusHubUrl: string;
}

export function statusChangeEmail(params: LegacyStatusChangeParams) {
  // Determine the event type from the status transition
  let eventType: StatusChangeParams["eventType"];
  if (params.newStatus === "OPERATIONAL") {
    eventType = params.oldStatus === "MAINTENANCE" ? "maintenance_completed" : "recovery";
  } else {
    const map: Record<string, StatusChangeParams["eventType"]> = {
      DEGRADED: "degraded",
      PARTIAL_OUTAGE: "partial_outage",
      MAJOR_OUTAGE: "major_outage",
      MAINTENANCE: "maintenance",
    };
    eventType = map[params.newStatus] ?? "major_outage";
  }

  return notificationEmail({
    eventType,
    ...params,
  });
}
