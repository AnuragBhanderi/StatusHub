import { STATUS_DISPLAY } from "@/lib/normalizer";

interface StatusChangeEmailParams {
  serviceName: string;
  serviceSlug: string;
  oldStatus: string;
  newStatus: string;
  incidentTitle?: string | null;
  statusHubUrl: string;
}

const STATUS_EMOJI: Record<string, string> = {
  OPERATIONAL: "\u2705",
  DEGRADED: "\u26a0\ufe0f",
  PARTIAL_OUTAGE: "\ud83d\udfe0",
  MAJOR_OUTAGE: "\ud83d\udd34",
  MAINTENANCE: "\ud83d\udd27",
  UNKNOWN: "\u2753",
};

export function statusChangeEmail({
  serviceName,
  serviceSlug,
  oldStatus,
  newStatus,
  incidentTitle,
  statusHubUrl,
}: StatusChangeEmailParams) {
  const oldDisplay = STATUS_DISPLAY[oldStatus] || { label: oldStatus, color: "#9e9e9e" };
  const newDisplay = STATUS_DISPLAY[newStatus] || { label: newStatus, color: "#9e9e9e" };
  const isRecovery = newStatus === "OPERATIONAL";
  const emoji = STATUS_EMOJI[newStatus] || "";
  const now = new Date();
  const timestamp = now.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  const subject = isRecovery
    ? `${emoji} ${serviceName} is back to Operational`
    : `${emoji} ${serviceName} — ${newDisplay.label} Detected`;

  const settingsUrl = statusHubUrl;
  const serviceUrl = `${statusHubUrl}?service=${serviceSlug}`;

  // Accent color based on new status
  const accentColor = newDisplay.color;
  const headerGradient = isRecovery
    ? "linear-gradient(135deg, #16a34a, #22c55e)"
    : `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)`;

  const html = `<!DOCTYPE html>
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
        <tr><td style="background:${headerGradient};padding:24px 28px;">
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
            <tr>
              <td>
                <span style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.5px;">StatusHub</span>
                <span style="color:rgba(255,255,255,0.7);font-size:12px;font-weight:500;margin-left:8px;">Alerts</span>
              </td>
              <td align="right">
                <span style="color:rgba(255,255,255,0.8);font-size:12px;font-weight:500;">${timestamp}</span>
              </td>
            </tr>
          </table>
        </td></tr>

        <!-- Title section -->
        <tr><td style="padding:28px 28px 0;">
          <p style="margin:0 0 4px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#a1a1aa;">
            Service Status Update
          </p>
          <p style="margin:0;font-size:20px;font-weight:700;color:#18181b;letter-spacing:-0.3px;">
            ${serviceName}
          </p>
        </td></tr>

        <!-- Timeline -->
        <tr><td style="padding:24px 28px;">
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#fafafa;border-radius:12px;border:1px solid #f0f0f3;">

            <!-- Previous status -->
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

            <!-- Connector line -->
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

            <!-- New status -->
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
        </td></tr>

        ${incidentTitle ? `
        <!-- Incident card -->
        <tr><td style="padding:0 28px 24px;">
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border-radius:10px;border:1px solid ${accentColor}20;background:${accentColor}08;">
            <tr><td style="padding:14px 18px;">
              <p style="margin:0 0 2px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:${accentColor};">Incident</p>
              <p style="margin:0;font-size:14px;color:#3f3f46;font-weight:500;line-height:1.5;">${incidentTitle}</p>
            </td></tr>
          </table>
        </td></tr>
        ` : ""}

        ${isRecovery ? `
        <!-- Recovery banner -->
        <tr><td style="padding:0 28px 24px;">
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border-radius:10px;background:linear-gradient(135deg,#f0fdf4,#dcfce7);border:1px solid #bbf7d0;">
            <tr><td style="padding:16px 18px;text-align:center;">
              <p style="margin:0;font-size:15px;font-weight:600;color:#16a34a;">\u2705 ${serviceName} is back to normal</p>
              <p style="margin:4px 0 0;font-size:12px;color:#4ade80;">All systems operational</p>
            </td></tr>
          </table>
        </td></tr>
        ` : ""}

        <!-- CTA Button -->
        <tr><td style="padding:0 28px 28px;">
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
            <tr><td align="center">
              <a href="${serviceUrl}" style="display:inline-block;background:#18181b;color:#ffffff;text-decoration:none;padding:12px 32px;border-radius:10px;font-size:14px;font-weight:600;letter-spacing:-0.2px;">
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
                  You're receiving this because <strong>${serviceName}</strong> is in your StatusHub stack.
                </p>
                <p style="margin:0;font-size:11px;">
                  <a href="${settingsUrl}" style="color:#6366f1;text-decoration:none;font-weight:500;">Manage notifications</a>
                  <span style="color:#d4d4d8;margin:0 6px;">&middot;</span>
                  <a href="${settingsUrl}" style="color:#a1a1aa;text-decoration:none;">Unsubscribe</a>
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

  const text = `${emoji} ${subject}

Service: ${serviceName}
Status:  ${oldDisplay.label} → ${newDisplay.label}
Time:    ${timestamp}
${incidentTitle ? `Incident: ${incidentTitle}\n` : ""}${isRecovery ? `\n${serviceName} is back to normal. All systems operational.\n` : ""}
View on StatusHub: ${serviceUrl}

---
Manage notifications: ${settingsUrl}
Unsubscribe: ${settingsUrl}`;

  return { subject, html, text };
}
