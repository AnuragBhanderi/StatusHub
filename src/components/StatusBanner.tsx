"use client";

import type { Theme } from "@/config/themes";
import { STATUS_DISPLAY } from "@/lib/normalizer";

interface ServiceSummary {
  slug: string;
  name: string;
  currentStatus: string;
}

interface StatusBannerProps {
  total: number;
  operational: number;
  issues: number;
  servicesWithIssues: ServiceSummary[];
  onSelectService: (slug: string) => void;
  t: Theme;
}

export default function StatusBanner({
  total,
  operational,
  issues,
  servicesWithIssues,
  onSelectService,
  t,
}: StatusBannerProps) {
  return (
    <div
      style={{
        background: issues > 0 ? t.bannerIssueBg : t.bannerOkBg,
        borderRadius: 16,
        padding: "22px 26px",
        marginBottom: 24,
        border: `1px solid ${issues > 0 ? t.bannerIssueBorder : t.bannerOkBorder}`,
        position: "relative",
        overflow: "hidden",
        transition: "all 0.3s ease",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -50,
          right: -50,
          width: 140,
          height: 140,
          borderRadius: "50%",
          background:
            issues > 0
              ? `rgba(255,82,82,${t.bannerCircle})`
              : `rgba(61,220,132,${t.bannerCircle})`,
        }}
      />
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          position: "relative",
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background:
              issues > 0
                ? "rgba(255,82,82,0.08)"
                : "rgba(61,220,132,0.08)",
            fontSize: 22,
            flexShrink: 0,
          }}
        >
          {issues > 0 ? (
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#ff5252"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          ) : (
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#3ddc84"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </div>
        <div style={{ flex: 1, minWidth: 180 }}>
          <div
            style={{
              fontWeight: 700,
              fontSize: 17,
              color: t.text,
              letterSpacing: -0.3,
              fontFamily: "var(--font-sans)",
            }}
          >
            {issues > 0
              ? `${issues} service${issues > 1 ? "s" : ""} reporting issues`
              : "All systems operational"}
          </div>
          <div
            style={{
              fontSize: 13,
              color: t.textMuted,
              marginTop: 3,
              fontFamily: "var(--font-sans)",
            }}
          >
            {operational}/{total} services fully operational
          </div>
        </div>
        {issues > 0 && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {servicesWithIssues.map((s) => {
              const sc =
                STATUS_DISPLAY[s.currentStatus] ||
                STATUS_DISPLAY.OPERATIONAL;
              return (
                <button
                  key={s.slug}
                  onClick={() => onSelectService(s.slug)}
                  style={{
                    background: sc.color + "12",
                    border: `1px solid ${sc.color}25`,
                    borderRadius: 8,
                    padding: "5px 10px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    color: sc.color,
                    fontSize: 12,
                    fontWeight: 600,
                    fontFamily: "var(--font-sans)",
                  }}
                >
                  <span
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: "50%",
                      background: sc.color,
                      boxShadow: `0 0 6px ${sc.color}66`,
                    }}
                  />
                  {s.name}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
