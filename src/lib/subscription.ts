import type { SupabaseClient } from "@supabase/supabase-js";

export type Plan = "free" | "pro";

export const FREE_PROJECT_LIMIT = 1;
export const FREE_SERVICES_PER_PROJECT = 5;
export const PRO_PROJECT_LIMIT = 3;
export const PRO_SERVICES_PER_PROJECT = 7;

export function getPlanLimits(plan: Plan) {
  if (plan === "pro") {
    return {
      maxProjects: PRO_PROJECT_LIMIT,
      maxServicesPerProject: PRO_SERVICES_PER_PROJECT,
    };
  }
  return {
    maxProjects: FREE_PROJECT_LIMIT,
    maxServicesPerProject: FREE_SERVICES_PER_PROJECT,
  };
}

export async function getUserPlan(
  supabase: SupabaseClient,
  userId: string
): Promise<Plan> {
  const { data } = await supabase
    .from("subscriptions")
    .select("plan, status, current_period_end")
    .eq("user_id", userId)
    .single();

  if (!data) return "free";
  if (data.plan !== "pro") return "free";
  if (data.status === "expired") return "free";

  // Cancelled users keep Pro until current_period_end
  if (data.status === "cancelled" && data.current_period_end) {
    if (new Date(data.current_period_end) < new Date()) return "free";
  }

  // active, cancelled (not yet expired), past_due all get Pro
  if (data.status === "active" || data.status === "cancelled" || data.status === "past_due") {
    return "pro";
  }

  return "free";
}
