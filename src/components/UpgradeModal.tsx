"use client";

import type { Theme } from "@/config/themes";
import { useState } from "react";

interface UpgradeModalProps {
  t: Theme;
  onClose: () => void;
}

interface PlanFeature {
  label: string;
  value: string | boolean;
}

const FREE_FEATURES: PlanFeature[] = [
  { label: "Project", value: "1" },
  { label: "Services per project", value: "5" },
  { label: "Email alerts", value: true },
  { label: "Push notifications", value: true },
  { label: "Public status page", value: false },
  { label: "Uptime reports", value: false },
  { label: "Weekly digest", value: false },
];

const PRO_FEATURES: PlanFeature[] = [
  { label: "Projects", value: "3" },
  { label: "Services per project", value: "7" },
  { label: "Email alerts", value: true },
  { label: "Push notifications", value: true },
  { label: "Public status page", value: true },
  { label: "Uptime reports", value: true },
  { label: "Weekly digest", value: true },
];

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
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(8px)",
        padding: 24,
      }}
    >
      <div
        className="animate-scale-in"
        style={{
          background: t.surface,
          border: `1px solid ${t.border}`,
          borderRadius: 20,
          maxWidth: 520,
          width: "100%",
          boxShadow: `0 24px 80px rgba(0,0,0,0.35)`,
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            background: "rgba(255,255,255,0.1)",
            border: "none",
            borderRadius: 8,
            width: 28,
            height: 28,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: "#fff",
            zIndex: 2,
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.2)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Gradient header */}
        <div style={{
          background: `linear-gradient(135deg, ${t.accentPrimary} 0%, ${t.accentSecondary} 60%, ${t.accentGreen} 100%)`,
          padding: "32px 28px 24px",
          position: "relative",
          overflow: "hidden",
        }}>
          <div style={{ position: "absolute", top: -40, right: -40, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.08)" }} />
          <div style={{ position: "absolute", bottom: -20, left: -20, width: 80, height: 80, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
          <div style={{ position: "relative", zIndex: 1 }}>
            <h2 style={{
              margin: 0,
              fontSize: 22,
              fontWeight: 800,
              color: "#fff",
              fontFamily: "var(--font-sans)",
              lineHeight: 1.3,
              letterSpacing: -0.5,
            }}>
              Choose your plan
            </h2>
            <p style={{
              margin: "6px 0 0",
              fontSize: 13,
              color: "rgba(255,255,255,0.7)",
              fontFamily: "var(--font-sans)",
              lineHeight: 1.5,
            }}>
              Start free, upgrade when you need more power.
            </p>
          </div>
        </div>

        {/* Two plan cards */}
        <div
          className="sh-upgrade-cards"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12,
            padding: "20px 20px 8px",
          }}
        >
          {/* Free card */}
          <div style={{
            border: `1px solid ${t.border}`,
            borderRadius: 14,
            padding: "18px 16px",
            display: "flex",
            flexDirection: "column",
            background: t.bg,
          }}>
            <div style={{ marginBottom: 14 }}>
              <div style={{
                fontSize: 13,
                fontWeight: 700,
                color: t.textSecondary,
                fontFamily: "var(--font-sans)",
                marginBottom: 4,
              }}>
                Free
              </div>
              <div style={{ display: "flex", alignItems: "baseline" }}>
                <span style={{ fontSize: 28, fontWeight: 800, color: t.text, fontFamily: "var(--font-sans)", letterSpacing: -1 }}>$0</span>
                <span style={{ fontSize: 12, color: t.textMuted, fontFamily: "var(--font-sans)", marginLeft: 3 }}>/mo</span>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
              {FREE_FEATURES.map((f) => (
                <FeatureItem key={f.label} label={f.label} value={f.value} t={t} muted />
              ))}
            </div>

            <div style={{
              marginTop: 16,
              padding: "9px 0",
              borderRadius: 9,
              border: `1px solid ${t.border}`,
              background: "transparent",
              textAlign: "center",
              fontSize: 12,
              fontWeight: 600,
              color: t.textMuted,
              fontFamily: "var(--font-sans)",
            }}>
              Current plan
            </div>
          </div>

          {/* Pro card */}
          <div style={{
            border: `1.5px solid ${t.accentPrimary}50`,
            borderRadius: 14,
            padding: "18px 16px",
            display: "flex",
            flexDirection: "column",
            background: `linear-gradient(180deg, ${t.accentPrimary}08 0%, transparent 50%)`,
            boxShadow: `0 0 24px ${t.accentPrimary}12`,
            position: "relative",
          }}>
            {/* Popular badge */}
            <div style={{
              position: "absolute",
              top: -1,
              right: 14,
              background: `linear-gradient(135deg, ${t.accentPrimary}, ${t.accentSecondary})`,
              color: "#fff",
              fontSize: 9,
              fontWeight: 700,
              fontFamily: "var(--font-mono)",
              padding: "3px 8px",
              borderRadius: "0 0 6px 6px",
              letterSpacing: 0.5,
              textTransform: "uppercase",
            }}>
              Popular
            </div>

            <div style={{ marginBottom: 14 }}>
              <div style={{
                fontSize: 13,
                fontWeight: 700,
                color: t.accentPrimary,
                fontFamily: "var(--font-sans)",
                marginBottom: 4,
                display: "flex",
                alignItems: "center",
                gap: 5,
              }}>
                Pro
                <svg width="12" height="12" viewBox="0 0 24 24" fill={t.accentPrimary} stroke="none">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </div>
              <div style={{ display: "flex", alignItems: "baseline" }}>
                <span style={{ fontSize: 28, fontWeight: 800, color: t.text, fontFamily: "var(--font-sans)", letterSpacing: -1 }}>$6</span>
                <span style={{ fontSize: 12, color: t.textMuted, fontFamily: "var(--font-sans)", marginLeft: 3 }}>/mo</span>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
              {PRO_FEATURES.map((f) => (
                <FeatureItem key={f.label} label={f.label} value={f.value} t={t} />
              ))}
            </div>

            <button
              onClick={handleUpgrade}
              disabled={loading}
              style={{
                marginTop: 16,
                padding: "9px 0",
                borderRadius: 9,
                border: "none",
                background: `linear-gradient(135deg, ${t.accentPrimary}, ${t.accentSecondary})`,
                color: "#fff",
                fontSize: 12,
                fontWeight: 700,
                cursor: loading ? "wait" : "pointer",
                fontFamily: "var(--font-sans)",
                transition: "all 0.2s",
                opacity: loading ? 0.7 : 1,
                boxShadow: `0 2px 12px ${t.accentPrimary}35`,
              }}
              onMouseEnter={(e) => { if (!loading) e.currentTarget.style.boxShadow = `0 4px 20px ${t.accentPrimary}50`; }}
              onMouseLeave={(e) => { e.currentTarget.style.boxShadow = `0 2px 12px ${t.accentPrimary}35`; }}
            >
              {loading ? "Redirecting..." : "Upgrade"}
            </button>
          </div>
        </div>

        {/* Dismiss */}
        <div style={{ padding: "8px 20px 20px", textAlign: "center" }}>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: t.textMuted,
              fontSize: 12,
              fontWeight: 500,
              cursor: "pointer",
              fontFamily: "var(--font-sans)",
              padding: "8px 16px",
              transition: "color 0.15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = t.textSecondary; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = t.textMuted; }}
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}

function FeatureItem({ label, value, t, muted }: {
  label: string;
  value: string | boolean;
  t: Theme;
  muted?: boolean;
}) {
  const isIncluded = value === true;
  const isExcluded = value === false;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
      {/* Icon */}
      {isExcluded ? (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={t.textFaint} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, opacity: 0.4 }}>
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      ) : (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={muted ? t.textMuted : t.accentGreen} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
          <polyline points="20 6 9 17 4 12" />
        </svg>
      )}

      {/* Label + value */}
      <span style={{
        fontSize: 11,
        color: isExcluded ? t.textFaint : (muted ? t.textMuted : t.textSecondary),
        fontFamily: "var(--font-sans)",
        lineHeight: 1.3,
        textDecoration: isExcluded ? "line-through" : "none",
      }}>
        {typeof value === "string" ? `${value} ${label.toLowerCase()}` : label}
      </span>
    </div>
  );
}
