import { STATUS_DISPLAY } from "@/lib/normalizer";

interface StatusChangeEmailParams {
  serviceName: string;
  serviceSlug: string;
  oldStatus: string;
  newStatus: string;
  incidentTitle?: string | null;
  statusHubUrl: string;
}

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

  const subject = `[StatusHub] ${serviceName}: ${oldDisplay.label} → ${newDisplay.label}`;

  const settingsUrl = `${statusHubUrl}`;

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;border:1px solid #e4e4e7;overflow:hidden;">
        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#6366f1,#16a34a);padding:20px 24px;">
          <span style="color:#fff;font-size:18px;font-weight:700;letter-spacing:-0.5px;">StatusHub</span>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:28px 24px;">
          <p style="margin:0 0 20px;font-size:15px;color:#18181b;font-weight:600;">
            Status change detected for ${serviceName}
          </p>

          <!-- Status change badges -->
          <table cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
            <tr>
              <td style="padding:6px 14px;border-radius:6px;background:${oldDisplay.color}18;color:${oldDisplay.color};font-size:13px;font-weight:600;border:1px solid ${oldDisplay.color}30;">
                ${oldDisplay.label}
              </td>
              <td style="padding:0 12px;color:#a1a1aa;font-size:16px;">→</td>
              <td style="padding:6px 14px;border-radius:6px;background:${newDisplay.color}18;color:${newDisplay.color};font-size:13px;font-weight:600;border:1px solid ${newDisplay.color}30;">
                ${newDisplay.label}
              </td>
            </tr>
          </table>

          ${incidentTitle ? `<p style="margin:0 0 20px;font-size:13px;color:#52525b;background:#f4f4f5;padding:12px 16px;border-radius:8px;border-left:3px solid ${newDisplay.color};">
            <strong>Incident:</strong> ${incidentTitle}
          </p>` : ""}

          <a href="${statusHubUrl}?service=${serviceSlug}" style="display:inline-block;background:#6366f1;color:#fff;text-decoration:none;padding:10px 20px;border-radius:8px;font-size:13px;font-weight:600;">
            View on StatusHub
          </a>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:16px 24px;border-top:1px solid #e4e4e7;background:#fafafa;">
          <p style="margin:0;font-size:11px;color:#a1a1aa;">
            You're receiving this because you have email alerts enabled for ${serviceName}.
            <a href="${settingsUrl}" style="color:#6366f1;text-decoration:none;">Manage notifications</a> · <a href="${settingsUrl}" style="color:#a1a1aa;text-decoration:none;">Unsubscribe</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const text = `[StatusHub] ${serviceName}: ${oldDisplay.label} → ${newDisplay.label}

Status change detected for ${serviceName}:
  ${oldDisplay.label} → ${newDisplay.label}
${incidentTitle ? `\nIncident: ${incidentTitle}` : ""}

View on StatusHub: ${statusHubUrl}?service=${serviceSlug}

---
Manage notification settings: ${settingsUrl}`;

  return { subject, html, text };
}
