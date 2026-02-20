import { NextResponse } from "next/server";
import { fetchServiceDetailLive } from "@/lib/live-fetch";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
    const detail = await fetchServiceDetailLive(slug);
    if (!detail) {
      return NextResponse.json(
        { error: "Service not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(detail);
  } catch (error) {
    console.error(`Failed to fetch service ${slug}:`, error);
    return NextResponse.json(
      { error: "Failed to fetch service" },
      { status: 500 }
    );
  }
}
