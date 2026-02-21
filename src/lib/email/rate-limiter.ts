import type { SupabaseClient } from "@supabase/supabase-js";

export async function shouldSendEmail(
  adminClient: SupabaseClient,
  userId: string,
  serviceSlug: string
): Promise<boolean> {
  const now = new Date();

  // Rule 1: Max 1 email per user per service per 30 minutes
  const thirtyMinAgo = new Date(now.getTime() - 30 * 60 * 1000).toISOString();
  const { count: recentForService } = await adminClient
    .from("email_alert_log")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("service_slug", serviceSlug)
    .gte("sent_at", thirtyMinAgo);

  if ((recentForService ?? 0) > 0) return false;

  // Rule 2: Max 10 emails per user per hour
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
  const { count: recentTotal } = await adminClient
    .from("email_alert_log")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("sent_at", oneHourAgo);

  if ((recentTotal ?? 0) >= 10) return false;

  return true;
}
