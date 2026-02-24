import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserPlan, getPlanLimits } from "@/lib/subscription";
import { services as serviceConfigs } from "@/config/services";

export const dynamic = "force-dynamic";

const validSlugs = new Set(serviceConfigs.map((s) => s.slug));

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50) || "project";
}

function generateShareCode(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let code = "";
  for (let i = 0; i < 7; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: projects } = await supabase
    .from("projects")
    .select("*")
    .eq("user_id", user.id)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: true });

  // Backfill share_code for projects that don't have one
  if (projects) {
    for (const p of projects) {
      if (!p.share_code) {
        const code = generateShareCode();
        await supabase
          .from("projects")
          .update({ share_code: code })
          .eq("id", p.id);
        p.share_code = code;
      }
    }
  }

  return NextResponse.json({ projects: projects || [] });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const name = (body.name || "New Project").trim().slice(0, 100);
  const serviceSlugs: string[] = (body.service_slugs || []).filter(
    (s: string) => validSlugs.has(s)
  );

  // Check project count limit
  const plan = await getUserPlan(supabase, user.id);
  const limits = getPlanLimits(plan);

  const { count } = await supabase
    .from("projects")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  if ((count ?? 0) >= limits.maxProjects) {
    return NextResponse.json(
      {
        error: `${plan === "free" ? "Free" : "Pro"} plan allows ${limits.maxProjects} project${limits.maxProjects === 1 ? "" : "s"}`,
        upgrade: plan === "free",
      },
      { status: 403 }
    );
  }

  // Check service count limit
  if (serviceSlugs.length > limits.maxServicesPerProject) {
    return NextResponse.json(
      {
        error: `Maximum ${limits.maxServicesPerProject} services per project`,
        upgrade: plan === "free",
      },
      { status: 403 }
    );
  }

  // Generate unique slug
  let slug = generateSlug(name);
  const { data: existing } = await supabase
    .from("projects")
    .select("slug")
    .eq("user_id", user.id)
    .eq("slug", slug)
    .single();

  if (existing) {
    slug = `${slug}-${Date.now().toString(36).slice(-4)}`;
  }

  const isFirst = (count ?? 0) === 0;

  const { data: project, error } = await supabase
    .from("projects")
    .insert({
      user_id: user.id,
      name,
      slug,
      service_slugs: serviceSlugs,
      is_default: isFirst,
      share_code: generateShareCode(),
    })
    .select()
    .single();

  if (error) {
    console.error("Failed to create project:", error);
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
  }

  return NextResponse.json({ project }, { status: 201 });
}
