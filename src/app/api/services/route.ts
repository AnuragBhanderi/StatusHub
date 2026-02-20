import { NextResponse } from "next/server";
import { fetchAllServicesLive } from "@/lib/live-fetch";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const services = await fetchAllServicesLive();
    return NextResponse.json({ services });
  } catch (error) {
    console.error("Failed to fetch services:", error);
    return NextResponse.json(
      { error: "Failed to fetch services" },
      { status: 500 }
    );
  }
}
