import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserPlan, getPlanLimits } from "@/lib/subscription";
import { services as serviceConfigs } from "@/config/services";

export const dynamic = "force-dynamic";

const validSlugs = new Set(serviceConfigs.map((s) => s.slug));

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ project });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify ownership
  const { data: existing } = await supabase
    .from("projects")
    .select("id, user_id, is_default")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json();
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (body.name !== undefined) {
    updates.name = String(body.name).trim().slice(0, 100);
  }

  if (body.service_slugs !== undefined) {
    const serviceSlugs: string[] = body.service_slugs.filter((s: string) =>
      validSlugs.has(s)
    );

    // Check per-project service limit
    const plan = await getUserPlan(supabase, user.id);
    const limits = getPlanLimits(plan);

    if (serviceSlugs.length > limits.maxServicesPerProject) {
      return NextResponse.json(
        {
          error: `Maximum ${limits.maxServicesPerProject} services per project`,
          upgrade: plan === "free",
        },
        { status: 403 }
      );
    }
    updates.service_slugs = serviceSlugs;
  }

  const { data: project, error } = await supabase
    .from("projects")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Failed to update project:", error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }

  return NextResponse.json({ project });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify ownership and check if default
  const { data: existing } = await supabase
    .from("projects")
    .select("id, user_id, is_default")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (existing.is_default) {
    return NextResponse.json(
      { error: "Cannot delete default project" },
      { status: 400 }
    );
  }

  await supabase.from("projects").delete().eq("id", id);

  return NextResponse.json({ deleted: true });
}
