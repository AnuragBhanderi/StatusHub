"use client";

import type { Theme } from "@/config/themes";
import { FREE_PROJECT_LIMIT, FREE_SERVICES_PER_PROJECT, PRO_PROJECT_LIMIT, PRO_SERVICES_PER_PROJECT } from "@/lib/subscription";
import { useState } from "react";

interface UpgradeModalProps {
  t: Theme;
  onClose: () => void;
}

export default function UpgradeModal({ t, onClose }: UpgradeModalProps) {
  const [loading, setLoading] = useState(false);

  async function handleUpgrade() {
    setLoading(true);
    try {
      const res = await fetch("/api/checkout", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        if (data.url) {
          window.location.href = data.url;
          return;
        }
      }
      setLoading(false);
    } catch {
      setLoading(false);
    }
  }

  const features = [
    { label: "Projects", free: `${FREE_PROJECT_LIMIT}`, pro: `${PRO_PROJECT_LIMIT}` },
    { label: "Services per project", free: `${FREE_SERVICES_PER_PROJECT}`, pro: `${PRO_SERVICES_PER_PROJECT}` },
    { label: "Email notifications", free: "All types", pro: "All types" },
    { label: "Browser notifications", free: "Yes", pro: "Yes" },
    { label: "Public status page", free: "No", pro: "Coming soon" },
    { label: "Uptime reports", free: "No", pro: "Coming soon" },
    { label: "Weekly digest", free: "No", pro: "Coming soon" },
  ];

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 300,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.5)",
        backdropFilter: "blur(4px)",
        padding: 24,
      }}
    >
      <div
        className="animate-scale-in"
        style={{
          background: t.surface,
          border: `1px solid ${t.border}`,
          borderRadius: 16,
          maxWidth: 480,
          width: "100%",
          boxShadow: t.shadowLg,
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div style={{ padding: "28px 28px 0" }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 8,
          }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: `${t.accentPrimary}15`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={t.accentPrimary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <div>
              <h2 style={{
                margin: 0,
                fontSize: 18,
                fontWeight: 700,
                color: t.text,
                fontFamily: "var(--font-sans)",
              }}>
                Upgrade to Pro
              </h2>
              <p style={{
                margin: 0,
                fontSize: 12,
                color: t.textMuted,
                fontFamily: "var(--font-sans)",
              }}>
                $6/month
              </p>
            </div>
          </div>
          <p style={{
            margin: "12px 0 0",
            fontSize: 13,
            color: t.textSecondary,
            lineHeight: 1.5,
            fontFamily: "var(--font-sans)",
          }}>
            More projects, more services, and premium features to keep your team in the loop.
          </p>
        </div>

        {/* Comparison table */}
        <div style={{ padding: "20px 28px" }}>
          <div style={{
            borderRadius: 10,
            border: `1px solid ${t.border}`,
            overflow: "hidden",
          }}>
            {/* Table header */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 80px 80px",
              padding: "10px 14px",
              background: t.tagBg,
              borderBottom: `1px solid ${t.border}`,
            }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: t.textMuted, fontFamily: "var(--font-mono)" }}>&nbsp;</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: t.textMuted, fontFamily: "var(--font-mono)", textAlign: "center" }}>Free</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: t.accentPrimary, fontFamily: "var(--font-mono)", textAlign: "center" }}>Pro</span>
            </div>
            {features.map((f, i) => (
              <div
                key={f.label}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 80px 80px",
                  padding: "10px 14px",
                  borderBottom: i < features.length - 1 ? `1px solid ${t.border}` : "none",
                }}
              >
                <span style={{ fontSize: 12, color: t.textSecondary, fontFamily: "var(--font-sans)" }}>{f.label}</span>
                <span style={{ fontSize: 12, color: t.textMuted, fontFamily: "var(--font-mono)", textAlign: "center" }}>{f.free}</span>
                <span style={{ fontSize: 12, color: t.text, fontWeight: 600, fontFamily: "var(--font-mono)", textAlign: "center" }}>{f.pro}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div style={{
          padding: "0 28px 24px",
          display: "flex",
          gap: 10,
        }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: "10px 0",
              borderRadius: 10,
              border: `1px solid ${t.border}`,
              background: "transparent",
              color: t.textSecondary,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "var(--font-sans)",
              transition: "all 0.15s",
            }}
          >
            Maybe Later
          </button>
          <button
            onClick={handleUpgrade}
            disabled={loading}
            style={{
              flex: 1,
              padding: "10px 0",
              borderRadius: 10,
              border: "none",
              background: t.accentPrimary,
              color: "#fff",
              fontSize: 13,
              fontWeight: 600,
              cursor: loading ? "wait" : "pointer",
              fontFamily: "var(--font-sans)",
              transition: "all 0.15s",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Redirecting..." : "Upgrade to Pro"}
          </button>
        </div>
      </div>
    </div>
  );
}
