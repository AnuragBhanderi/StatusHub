import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("notification_preferences")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (error && error.code !== "PGRST116") {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Return defaults if no preferences exist yet
  return NextResponse.json({
    preferences: data || {
      push_enabled: false,
      email_enabled: false,
      email_address: user.email || null,
      severity_threshold: "all",
    },
  });
}

export async function PUT(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { push_enabled, email_enabled, email_address, severity_threshold } = body;

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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ preferences: data });
}
