import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;

  if (!code) {
    return NextResponse.json({ error: "Share code is required" }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: project, error } = await admin
    .from("projects")
    .select("name, service_slugs")
    .eq("share_code", code.toLowerCase())
    .single();

  if (error || !project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  return NextResponse.json({
    name: project.name,
    services: project.service_slugs,
  });
}
