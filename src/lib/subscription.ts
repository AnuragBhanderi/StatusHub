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
    .select("plan, status, current_period_end, is_promo")
    .eq("user_id", userId)
    .single();

  if (!data) return "free";
  if (data.plan !== "pro") return "free";
  if (data.status === "expired") return "free";

  // Promo subscriptions expire when current_period_end passes
  if (data.is_promo && data.current_period_end) {
    if (new Date(data.current_period_end) < new Date()) return "free";
  }

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

export interface PromoInfo {
  isPromo: boolean;
  trialEndsAt: string | null;
}

export interface ActiveServiceInfo {
  activeSlugs: Set<string>;
  frozenSlugs: Set<string>;
  activeProjectIds: Set<string>;
  frozenProjectIds: Set<string>;
}

/**
 * Determine which services are "active" (monitored/emailed) vs "frozen" based on plan limits.
 * Rules:
 *   - Only projects up to maxProjects are active (default project first)
 *   - Within active projects, only the first maxServicesPerProject slugs are active
 *   - Everything else is frozen (visible but not monitored)
 */
export function getActiveServiceInfo(
  projects: { id: string; service_slugs: string[]; is_default: boolean }[],
  plan: Plan
): ActiveServiceInfo {
  const limits = getPlanLimits(plan);
  const sorted = [...projects].sort((a, b) =>
    a.is_default ? -1 : b.is_default ? 1 : 0
  );

  const activeSlugs = new Set<string>();
  const frozenSlugs = new Set<string>();
  const activeProjectIds = new Set<string>();
  const frozenProjectIds = new Set<string>();

  let projectCount = 0;
  for (const project of sorted) {
    projectCount++;
    const isActiveProject = projectCount <= limits.maxProjects;

    if (isActiveProject) {
      activeProjectIds.add(project.id);
      project.service_slugs.forEach((slug, i) => {
        if (i < limits.maxServicesPerProject) {
          activeSlugs.add(slug);
        } else {
          frozenSlugs.add(slug);
        }
      });
    } else {
      frozenProjectIds.add(project.id);
      project.service_slugs.forEach((s) => frozenSlugs.add(s));
    }
  }

  return { activeSlugs, frozenSlugs, activeProjectIds, frozenProjectIds };
}

/**
 * For the cron job: resolve plan from a raw subscription row without async DB call.
 */
export function resolvePlanFromRow(row: {
  plan: string;
  status: string;
  current_period_end: string | null;
  is_promo: boolean;
}): Plan {
  if (row.plan !== "pro") return "free";
  if (row.status === "expired") return "free";

  if (row.is_promo && row.current_period_end) {
    if (new Date(row.current_period_end) < new Date()) return "free";
  }

  if (row.status === "cancelled" && row.current_period_end) {
    if (new Date(row.current_period_end) < new Date()) return "free";
  }

  if (row.status === "active" || row.status === "cancelled" || row.status === "past_due") {
    return "pro";
  }

  return "free";
}

export async function getPromoInfo(
  supabase: SupabaseClient,
  userId: string
): Promise<PromoInfo | null> {
  const { data } = await supabase
    .from("subscriptions")
    .select("is_promo, current_period_end")
    .eq("user_id", userId)
    .single();

  if (!data || !data.is_promo) return null;

  // Check if promo is still active
  if (data.current_period_end && new Date(data.current_period_end) < new Date()) {
    return null;
  }

  return {
    isPromo: true,
    trialEndsAt: data.current_period_end,
  };
}
