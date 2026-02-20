"use client";

import type { Theme } from "@/config/themes";
import { STATUS_DISPLAY } from "@/lib/normalizer";
import StatusDot from "./StatusDot";
import LogoIcon from "./LogoIcon";

interface ServiceCardProps {
  name: string;
  slug: string;
  currentStatus: string;
  logoUrl?: string | null;
  latestIncident?: { title: string } | null;
  onClick: () => void;
  isInStack: boolean;
  onToggleStack: () => void;
  t: Theme;
}

export default function ServiceCard({
  name,
  slug,
  currentStatus,
  logoUrl,
  latestIncident,
  onClick,
  isInStack,
  onToggleStack,
  t,
}: ServiceCardProps) {
  const sc = STATUS_DISPLAY[currentStatus] || STATUS_DISPLAY.OPERATIONAL;
  const hasIssue = currentStatus !== "OPERATIONAL";

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      aria-label={`${name} — ${sc.label}. Click to view details.`}
      className="group"
      style={{
        background: hasIssue
          ? `linear-gradient(135deg, ${sc.color}08, ${t.surface})`
          : t.surface,
        borderRadius: 14,
        padding: "16px 18px",
        border: `1px solid ${hasIssue ? sc.color + "25" : t.border}`,
        cursor: "pointer",
        transition: "all 0.2s ease",
        outline: "none",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = t.cardShadow;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
      }}
      onFocus={(e) => {
        e.currentTarget.style.boxShadow = `0 0 0 2px ${t.accentPrimary}40`;
      }}
      onBlur={(e) => {
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      <div
        style={{ display: "flex", alignItems: "center", gap: 12 }}
      >
        <LogoIcon name={name} logoUrl={logoUrl} size={36} t={t} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span
              style={{
                fontWeight: 600,
                fontSize: 14,
                color: t.text,
                fontFamily: "var(--font-sans)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {name}
            </span>
            <StatusDot status={currentStatus} size={7} />
          </div>
          <span
            style={{
              fontSize: 12,
              color: sc.color,
              fontWeight: 500,
              fontFamily: "var(--font-sans)",
              opacity: 0.9,
            }}
          >
            {sc.label}
          </span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleStack();
          }}
          aria-label={isInStack ? `Remove ${name} from My Stack` : `Add ${name} to My Stack`}
          style={{
            background: isInStack ? t.stackBtnBg : "transparent",
            border: `1px solid ${isInStack ? t.stackBtnBorder : t.border}`,
            borderRadius: 8,
            width: 30,
            height: 30,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            fontSize: 13,
            color: isInStack ? t.accentPrimary : t.stackBtnInactive,
            transition: "all 0.15s",
          }}
        >
          {isInStack ? (
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill={t.accentPrimary}
              stroke={t.accentPrimary}
              strokeWidth="1"
            >
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          ) : (
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          )}
        </button>
      </div>
      {hasIssue && latestIncident && (
        <div
          style={{
            marginTop: 10,
            paddingTop: 10,
            borderTop: `1px solid ${t.divider}`,
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: 12,
              color: t.textMuted,
              lineHeight: 1.4,
              fontFamily: "var(--font-sans)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {latestIncident.title}
          </p>
        </div>
      )}
    </div>
  );
}
