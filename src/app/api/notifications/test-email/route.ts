import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTransporter } from "@/lib/email/transporter";
import { statusChangeEmail } from "@/lib/email/templates";

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

  const statusHubUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://statushub-seven.vercel.app";

  const { subject, html, text } = statusChangeEmail({
    serviceName: "GitHub",
    serviceSlug: "github",
    oldStatus: "OPERATIONAL",
    newStatus: "MAJOR_OUTAGE",
    incidentTitle: "This is a test notification from StatusHub",
    statusHubUrl,
  });

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
