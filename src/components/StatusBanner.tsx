"use client";

import type { Theme } from "@/config/themes";
import { STATUS_DISPLAY, MONITORING_DISPLAY } from "@/lib/normalizer";

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
  monitoringOnlyCount?: number;
  t: Theme;
}

export default function StatusBanner({
  total,
  operational,
  issues,
  servicesWithIssues,
  onSelectService,
  monitoringOnlyCount = 0,
  t,
}: StatusBannerProps) {
  return (
    <div
      className="sh-banner"
      style={{
        background: issues > 0 ? t.bannerIssueBg : t.bannerOkBg,
        borderRadius: 10,
        padding: "20px 24px",
        marginBottom: 24,
        border: `1px solid ${issues > 0 ? t.bannerIssueBorder : t.bannerOkBorder}`,
        position: "relative",
        overflow: "hidden",
        transition: "all 0.3s ease",
      }}
    >
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
          className="sh-banner-icon"
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background:
              issues > 0
                ? "#ef444410"
                : "#16a34a10",
            flexShrink: 0,
          }}
        >
          {issues > 0 ? (
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#ef4444"
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
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#16a34a"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </div>
        <div style={{ flex: 1, minWidth: 140 }}>
          <div
            className="sh-banner-title"
            style={{
              fontWeight: 600,
              fontSize: 15,
              color: t.text,
              letterSpacing: -0.2,
              fontFamily: "var(--font-sans)",
            }}
          >
            {issues > 0
              ? `${issues} service${issues > 1 ? "s" : ""} reporting issues`
              : "All systems operational"}
          </div>
          <div
            className="sh-banner-subtitle"
            style={{
              fontSize: 12,
              color: t.textMuted,
              marginTop: 3,
              fontFamily: "var(--font-sans)",
            }}
          >
            {operational}/{total} services fully operational
          </div>
          {issues === 0 && monitoringOnlyCount > 0 && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                marginTop: 6,
                fontSize: 12,
                color: MONITORING_DISPLAY.color,
                fontFamily: "var(--font-sans)",
              }}
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke={MONITORING_DISPLAY.color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              {monitoringOnlyCount} service{monitoringOnlyCount > 1 ? "s" : ""} with deployed fixes being monitored
            </div>
          )}
        </div>
        {issues > 0 && (
          <div className="sh-banner-chips" style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {servicesWithIssues.map((s) => {
              const sc =
                STATUS_DISPLAY[s.currentStatus] ||
                STATUS_DISPLAY.OPERATIONAL;
              return (
                <button
                  key={s.slug}
                  onClick={() => onSelectService(s.slug)}
                  style={{
                    background: sc.color + "10",
                    border: `1px solid ${sc.color}20`,
                    borderRadius: 6,
                    padding: "4px 10px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    color: sc.color,
                    fontSize: 12,
                    fontWeight: 600,
                    fontFamily: "var(--font-sans)",
                    transition: "all 0.15s",
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
