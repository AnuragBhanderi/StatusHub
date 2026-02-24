import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTransporter } from "@/lib/email/transporter";
import { notificationEmail } from "@/lib/email/templates";

export const dynamic = "force-dynamic";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get user's notification preferences
  const { data: prefs } = await supabase
    .from("notification_preferences")
    .select("email_address")
    .eq("user_id", user.id)
    .single();

  const emailAddress = prefs?.email_address || user.email;
  if (!emailAddress) {
    return NextResponse.json(
      { error: "No email address configured" },
      { status: 400 }
    );
  }

  const statusHubUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://statushub.orphilia.com";

  const { subject, html, text } = notificationEmail(
    {
      eventType: "new_incident",
      serviceName: "GitHub",
      serviceSlug: "github",
      incidentTitle: "Degraded availability for Actions and API requests",
      incidentImpact: "MAJOR",
      incidentStatus: "INVESTIGATING",
      incidentStartedAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      statusHubUrl,
      latestUpdateBody: "We are investigating reports of degraded performance for GitHub Actions and API requests. Some users may experience failed workflow runs and increased error rates on API calls. Our engineering team is actively working to identify the root cause.",
      affectedComponents: [
        { name: "Actions", status: "MAJOR_OUTAGE" },
        { name: "API Requests", status: "DEGRADED" },
        { name: "Git Operations", status: "OPERATIONAL" },
        { name: "Webhooks", status: "PARTIAL_OUTAGE" },
        { name: "Pages", status: "OPERATIONAL" },
      ],
    },
    [
      { emoji: "\u26a0\ufe0f", label: "Degraded", detail: "OPERATIONAL \u2192 DEGRADED" },
      { emoji: "\ud83d\udcdd", label: "Incident Update", detail: "investigating connectivity issues" },
    ]
  );

  try {
    const transporter = getTransporter();
    await transporter.sendMail({
      from: process.env.SMTP_FROM || "StatusHub <alerts@statushub.dev>",
      to: emailAddress,
      subject: `Test \u2014 ${subject}`,
      html,
      text,
      headers: {
        "List-Unsubscribe": `<${statusHubUrl}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
    });

    return NextResponse.json({ success: true, sentTo: emailAddress });
  } catch (err) {
    console.error("Test email error:", err);
    return NextResponse.json(
      { error: "Failed to send test email. Check SMTP configuration." },
      { status: 500 }
    );
  }
}
