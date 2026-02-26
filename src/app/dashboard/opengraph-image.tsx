import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "StatusHub Dashboard - Monitor 48 cloud services in real-time";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
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

        {/* Logo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 72,
            height: 72,
            borderRadius: 18,
            background: "linear-gradient(135deg, #6366f1, #818cf8, #3ddc84)",
            marginBottom: 28,
            boxShadow: "0 0 60px rgba(99,102,241,0.3)",
          }}
        >
          <svg width="40" height="40" viewBox="0 0 32 32" fill="none">
            <path d="M5 16h5l3.5-8 5.5 16 3.5-8H28" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        {/* Title */}
        <div style={{ fontSize: 56, fontWeight: 800, color: "#ffffff", letterSpacing: -2, marginBottom: 8, display: "flex" }}>
          Dashboard
        </div>

        {/* Subtitle */}
        <div style={{ fontSize: 24, color: "rgba(255,255,255,0.6)", fontWeight: 500, marginBottom: 36, display: "flex" }}>
          48 services monitored in real-time
        </div>

        {/* Status indicators */}
        <div style={{ display: "flex", gap: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", borderRadius: 12, background: "rgba(61,220,132,0.1)", border: "1px solid rgba(61,220,132,0.2)" }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#3ddc84", display: "flex" }} />
            <span style={{ fontSize: 18, color: "#3ddc84", fontWeight: 600 }}>Operational</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", borderRadius: 12, background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.2)" }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#fbbf24", display: "flex" }} />
            <span style={{ fontSize: 18, color: "#fbbf24", fontWeight: 600 }}>Degraded</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", borderRadius: 12, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ef4444", display: "flex" }} />
            <span style={{ fontSize: 18, color: "#ef4444", fontWeight: 600 }}>Outage</span>
          </div>
        </div>

        {/* Footer */}
        <div style={{ position: "absolute", bottom: 32, display: "flex", alignItems: "center", gap: 8, fontSize: 16, color: "rgba(255,255,255,0.3)" }}>
          statushub.live/dashboard
        </div>
      </div>
    ),
    { ...size }
  );
}
