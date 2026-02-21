import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// GET: Load user preferences + notification preferences
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch both in parallel
  const [prefsResult, notifResult] = await Promise.all([
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
  ]);

  return NextResponse.json({
    user: { id: user.id, email: user.email },
    preferences: prefsResult.data || null,
    notificationPreferences: notifResult.data || null,
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

  // Save user preferences if provided
  if (body.preferences) {
    const { theme, compact, my_stack } = body.preferences;
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (theme !== undefined) updates.theme = theme;
    if (compact !== undefined) updates.compact = compact;
    if (my_stack !== undefined) updates.my_stack = my_stack;

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
