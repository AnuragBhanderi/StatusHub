"use client";

import type { Theme } from "@/config/themes";

interface LoadingStateProps {
  t: Theme;
  title?: string;
  subtitle?: string;
  showSkeletons?: boolean;
  skeletonCount?: number;
}

export default function LoadingState({
  t,
  title = "Fetching live status data",
  subtitle,
  showSkeletons = true,
  skeletonCount = 9,
}: LoadingStateProps) {
  return (
    <div
      className="animate-fade-in"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "120px 24px",
      }}
    >
      {/* Spinner */}
      <div
        style={{
          position: "relative",
          width: 44,
          height: 44,
          marginBottom: 28,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            border: `2px solid ${t.border}`,
          }}
        />
        <div
          className="animate-spin-slow"
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            border: "2px solid transparent",
            borderTopColor: t.accentPrimary,
            borderRightColor: t.accentPrimary,
            animation: "spin-slow 1s linear infinite",
          }}
        />
      </div>

      <div
        style={{
          fontSize: 16,
          fontWeight: 600,
          color: t.text,
          fontFamily: "var(--font-sans)",
          marginBottom: 8,
        }}
      >
        {title}
      </div>

      {subtitle && (
        <div
          style={{
            fontSize: 13,
            color: t.textMuted,
            fontFamily: "var(--font-sans)",
            textAlign: "center",
            maxWidth: 360,
            lineHeight: 1.5,
          }}
        >
          {subtitle}
        </div>
      )}

      {showSkeletons && (
        <div
          style={{
            width: "100%",
            maxWidth: 900,
            marginTop: 48,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: 10,
          }}
        >
          {Array.from({ length: skeletonCount }).map((_, i) => (
            <div
              key={i}
              style={{
                background: t.surface,
                borderRadius: 10,
                padding: "16px 18px",
                border: `1px solid ${t.border}`,
                opacity: 0.5 - i * 0.04,
                animation: `fade-in 0.4s ease ${i * 0.06}s both`,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    background: t.logoBg,
                    border: `1px solid ${t.logoBorder}`,
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      height: 12,
                      width: 80 + ((i * 17) % 40),
                      borderRadius: 6,
                      background: t.logoBg,
                      marginBottom: 8,
                    }}
                  />
                  <div
                    style={{
                      height: 10,
                      width: 60,
                      borderRadius: 5,
                      background: t.logoBg,
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
