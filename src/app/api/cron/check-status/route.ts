import { NextRequest, NextResponse } from "next/server";
import { fetchAllServicesLive } from "@/lib/live-fetch";
import { createAdminClient } from "@/lib/supabase/admin";
import { getTransporter } from "@/lib/email/transporter";
import { statusChangeEmail } from "@/lib/email/templates";
import { shouldSendEmail } from "@/lib/email/rate-limiter";
import { meetsThreshold } from "@/lib/email/severity-filter";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const adminClient = createAdminClient();
    const services = await fetchAllServicesLive();

    // Load previous snapshots
    const { data: snapshots } = await adminClient
      .from("service_status_snapshots")
      .select("*");

    const snapshotMap = new Map(
      (snapshots || []).map((s: { service_slug: string; status: string; incident_title: string | null }) => [s.service_slug, s])
    );

    // Detect status changes
    const changes: { slug: string; name: string; oldStatus: string; newStatus: string; incidentTitle: string | null }[] = [];

    for (const service of services) {
      const prev = snapshotMap.get(service.slug) as { status: string } | undefined;
      const oldStatus = prev?.status || "OPERATIONAL";

      if (oldStatus !== service.currentStatus) {
        changes.push({
          slug: service.slug,
          name: service.name,
          oldStatus,
          newStatus: service.currentStatus,
          incidentTitle: service.latestIncident?.title || null,
        });
      }
    }

    let emailsSent = 0;

    if (changes.length > 0) {
      // Get all users with email alerts enabled
      const { data: allPrefs } = await adminClient
        .from("notification_preferences")
        .select("user_id, email_enabled, email_address, severity_threshold")
        .eq("email_enabled", true);

      // Get all users' my_stack preferences
      const { data: allUserPrefs } = await adminClient
        .from("user_preferences")
        .select("user_id, my_stack");

      const stackMap = new Map(
        (allUserPrefs || []).map((p: { user_id: string; my_stack: string[] }) => [p.user_id, new Set(p.my_stack)])
      );

      const transporter = getTransporter();
      const statusHubUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://statushub-seven.vercel.app";

      for (const change of changes) {
        for (const pref of allPrefs || []) {
          // Check if service is in user's stack
          const userStack = stackMap.get(pref.user_id);
          if (!userStack || !userStack.has(change.slug)) continue;

          // Check severity threshold (pass oldStatus so recoveries are notified)
          if (!meetsThreshold(change.newStatus, pref.severity_threshold || "all", change.oldStatus)) continue;

          // Check email address exists
          if (!pref.email_address) continue;

          // Check rate limit
          const canSend = await shouldSendEmail(adminClient, pref.user_id, change.slug);
          if (!canSend) continue;

          // Send email
          const { subject, html, text } = statusChangeEmail({
            serviceName: change.name,
            serviceSlug: change.slug,
            oldStatus: change.oldStatus,
            newStatus: change.newStatus,
            incidentTitle: change.incidentTitle,
            statusHubUrl,
          });

          try {
            await transporter.sendMail({
              from: process.env.SMTP_FROM || "StatusHub <alerts@statushub.dev>",
              to: pref.email_address,
              subject,
              html,
              text,
              headers: {
                "List-Unsubscribe": `<${statusHubUrl}>`,
                "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
              },
            });

            // Log the sent email
            await adminClient.from("email_alert_log").insert({
              user_id: pref.user_id,
              service_slug: change.slug,
              old_status: change.oldStatus,
              new_status: change.newStatus,
            });

            emailsSent++;
          } catch (err) {
            console.error(`Failed to send email to ${pref.email_address}:`, err);
          }
        }
      }
    }

    // Upsert all current snapshots
    for (const service of services) {
      await adminClient
        .from("service_status_snapshots")
        .upsert(
          {
            service_slug: service.slug,
            status: service.currentStatus,
            incident_title: service.latestIncident?.title || null,
            snapshot_at: new Date().toISOString(),
          },
          { onConflict: "service_slug" }
        );
    }

    return NextResponse.json({
      checked: services.length,
      changes: changes.length,
      emailsSent,
      changedServices: changes.map((c) => ({
        slug: c.slug,
        from: c.oldStatus,
        to: c.newStatus,
      })),
    });
  } catch (err) {
    console.error("Cron check-status error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
