import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserPlan, getPromoInfo } from "@/lib/subscription";

export const dynamic = "force-dynamic";

// GET: Load user preferences + notification preferences + plan + projects
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch all in parallel
  const [prefsResult, notifResult, projectsResult, subResult, plan, promoInfo] = await Promise.all([
    supabase
      .from("user_preferences")
      .select("*")
      .eq("user_id", user.id)
      .single(),
    supabase
      .from("notification_preferences")
      .select("*")
      .eq("user_id", user.id)
      .single(),
    supabase
      .from("projects")
      .select("*")
      .eq("user_id", user.id)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: true }),
    supabase
      .from("subscriptions")
      .select("is_promo, current_period_end")
      .eq("user_id", user.id)
      .single(),
    getUserPlan(supabase, user.id),
    getPromoInfo(supabase, user.id),
  ]);

  // Detect if user was on a promo trial that has expired (for showing downgrade modal)
  const wasProTrial = !!(
    subResult.data?.is_promo &&
    subResult.data?.current_period_end &&
    new Date(subResult.data.current_period_end) < new Date() &&
    plan === "free"
  );

  // Backfill share_code for projects that don't have one
  const projects = projectsResult.data || [];
  for (const p of projects) {
    if (!p.share_code) {
      const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
      let code = "";
      for (let i = 0; i < 7; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
      }
      await supabase.from("projects").update({ share_code: code }).eq("id", p.id);
      p.share_code = code;
    }
  }

  return NextResponse.json({
    user: { id: user.id, email: user.email },
    preferences: prefsResult.data || null,
    notificationPreferences: notifResult.data || null,
    projects,
    plan,
    promoInfo,
    wasProTrial,
  });
}

// PUT: Save user preferences and/or notification preferences
export async function PUT(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const results: { preferences?: unknown; notificationPreferences?: unknown; errors: string[] } = { errors: [] };

  // Save user preferences if provided (theme, compact only — my_stack removed)
  if (body.preferences) {
    const { theme, compact } = body.preferences;
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (theme !== undefined) updates.theme = theme;
    if (compact !== undefined) updates.compact = compact;

    const { data, error } = await supabase
      .from("user_preferences")
      .upsert(
        { user_id: user.id, ...updates },
        { onConflict: "user_id" }
      )
      .select()
      .single();

    if (error) {
      results.errors.push("preferences: " + error.message);
    } else {
      results.preferences = data;
    }
  }

  // Save notification preferences if provided
  if (body.notificationPreferences) {
    const { push_enabled, email_enabled, email_address, severity_threshold } = body.notificationPreferences;
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (push_enabled !== undefined) updates.push_enabled = push_enabled;
    if (email_enabled !== undefined) updates.email_enabled = email_enabled;
    if (email_address !== undefined) updates.email_address = email_address;
    if (severity_threshold !== undefined) updates.severity_threshold = severity_threshold;

    const { data, error } = await supabase
      .from("notification_preferences")
      .upsert(
        { user_id: user.id, ...updates },
        { onConflict: "user_id" }
      )
      .select()
      .single();

    if (error) {
      results.errors.push("notifications: " + error.message);
    } else {
      results.notificationPreferences = data;
    }
  }

  if (results.errors.length > 0) {
    return NextResponse.json(results, { status: 500 });
  }

  return NextResponse.json(results);
}
