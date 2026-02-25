import { ImageResponse } from "next/og";
import { services } from "@/config/services";

export const runtime = "edge";
export const alt = "Service Status | StatusHub";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const service = services.find((s) => s.slug === slug);
  const name = service?.name || slug;
  const category = service?.category || "Service";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #09090b 0%, #0f0f23 50%, #09090b 100%)",
          fontFamily: "system-ui, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -100,
            left: "30%",
            width: 500,
            height: 500,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)",
            display: "flex",
          }}
        />

        {/* Category label */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 20px",
            borderRadius: 20,
            background: "rgba(99,102,241,0.1)",
            border: "1px solid rgba(99,102,241,0.2)",
            marginBottom: 24,
          }}
        >
          <span style={{ fontSize: 16, color: "rgba(165,180,252,0.8)", fontWeight: 600 }}>
            {category}
          </span>
        </div>

        {/* Service name */}
        <div style={{ fontSize: 64, fontWeight: 800, color: "#ffffff", letterSpacing: -2, marginBottom: 12, display: "flex" }}>
          {name}
        </div>

        {/* Subtitle */}
        <div style={{ fontSize: 24, color: "rgba(255,255,255,0.6)", fontWeight: 500, marginBottom: 36, display: "flex" }}>
          Real-time status &amp; incidents
        </div>

        {/* StatusHub branding */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 40,
              height: 40,
              borderRadius: 10,
              background: "linear-gradient(135deg, #6366f1, #818cf8, #3ddc84)",
            }}
          >
            <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
              <path d="M5 16h5l3.5-8 5.5 16 3.5-8H28" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span style={{ fontSize: 28, fontWeight: 700, color: "rgba(255,255,255,0.8)", letterSpacing: -0.5 }}>
            StatusHub
          </span>
        </div>

        {/* Footer */}
        <div style={{ position: "absolute", bottom: 32, display: "flex", alignItems: "center", gap: 8, fontSize: 16, color: "rgba(255,255,255,0.3)" }}>
          statushub.orphilia.com/service/{slug}
        </div>
      </div>
    ),
    { ...size }
  );
}
