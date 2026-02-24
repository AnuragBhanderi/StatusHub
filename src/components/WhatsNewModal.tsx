"use client";

import type { Theme } from "@/config/themes";
import type { ChangelogEntry } from "@/config/changelog";

interface WhatsNewModalProps {
  t: Theme;
  entries: ChangelogEntry[];
  onClose: () => void;
}

const FEATURE_ICONS: Record<string, string> = {
  Projects: "M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z",
  "Email & Push Alerts": "M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9",
  "Pro Plan": "M12 2L2 7l10 5 10-5-10-5z",
};

export default function WhatsNewModal({ t, entries, onClose }: WhatsNewModalProps) {
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
          maxWidth: 460,
          width: "100%",
          boxShadow: "0 24px 80px rgba(0,0,0,0.35)",
          overflow: "hidden",
          position: "relative",
          maxHeight: "80vh",
          display: "flex",
          flexDirection: "column",
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
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.2)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.1)";
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Gradient header */}
        <div
          style={{
            background: `linear-gradient(135deg, ${t.accentPrimary} 0%, ${t.accentSecondary} 60%, ${t.accentGreen} 100%)`,
            padding: "32px 28px 24px",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div style={{ position: "absolute", top: -40, right: -40, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.08)" }} />
          <div style={{ position: "absolute", bottom: -20, left: -20, width: 80, height: 80, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
          <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", gap: 10 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            <div>
              <h2 style={{
                margin: 0,
                fontSize: 22,
                fontWeight: 800,
                color: "#fff",
                fontFamily: "var(--font-sans)",
                lineHeight: 1.3,
                letterSpacing: -0.5,
              }}>
                What&apos;s New
              </h2>
              <p style={{
                margin: "4px 0 0",
                fontSize: 13,
                color: "rgba(255,255,255,0.7)",
                fontFamily: "var(--font-sans)",
                lineHeight: 1.5,
              }}>
                Latest updates and improvements
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div style={{ overflowY: "auto", flex: 1, padding: "16px 20px 8px" }}>
          {entries.map((entry) => (
            <div key={entry.id} style={{ marginBottom: 16 }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 8,
              }}>
                <span style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: t.text,
                  fontFamily: "var(--font-sans)",
                }}>
                  {entry.title}
                </span>
                <span style={{
                  fontSize: 10,
                  color: t.textMuted,
                  fontFamily: "var(--font-mono)",
                  background: t.tagBg,
                  padding: "2px 6px",
                  borderRadius: 4,
                }}>
                  {entry.date}
                </span>
              </div>
              <p style={{
                fontSize: 12,
                color: t.textMuted,
                fontFamily: "var(--font-sans)",
                lineHeight: 1.5,
                margin: "0 0 12px",
              }}>
                {entry.summary}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {entry.features.map((feature) => (
                  <div
                    key={feature.title}
                    style={{
                      display: "flex",
                      gap: 10,
                      padding: "10px 12px",
                      background: t.bg,
                      border: `1px solid ${t.border}`,
                      borderRadius: 10,
                    }}
                  >
                    <div style={{
                      width: 28,
                      height: 28,
                      borderRadius: 7,
                      background: `${t.accentPrimary}15`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}>
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke={t.accentPrimary}
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        {FEATURE_ICONS[feature.title] ? (
                          <path d={FEATURE_ICONS[feature.title]} />
                        ) : (
                          <polyline points="20 6 9 17 4 12" />
                        )}
                      </svg>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: t.text,
                        fontFamily: "var(--font-sans)",
                        marginBottom: 2,
                      }}>
                        {feature.title}
                      </div>
                      <div style={{
                        fontSize: 11,
                        color: t.textMuted,
                        fontFamily: "var(--font-sans)",
                        lineHeight: 1.4,
                      }}>
                        {feature.description}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ padding: "12px 20px 20px", textAlign: "center" }}>
          <button
            onClick={onClose}
            style={{
              padding: "10px 32px",
              borderRadius: 10,
              border: "none",
              background: `linear-gradient(135deg, ${t.accentPrimary}, ${t.accentSecondary})`,
              color: "#fff",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "var(--font-sans)",
              transition: "all 0.2s",
              boxShadow: `0 2px 12px ${t.accentPrimary}35`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = `0 4px 20px ${t.accentPrimary}50`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = `0 2px 12px ${t.accentPrimary}35`;
            }}
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
