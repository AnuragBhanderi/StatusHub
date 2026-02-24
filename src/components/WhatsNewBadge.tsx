"use client";

import type { Theme } from "@/config/themes";

interface WhatsNewBadgeProps {
  t: Theme;
  hasNew: boolean;
  onClick: () => void;
}

export default function WhatsNewBadge({ t, hasNew, onClick }: WhatsNewBadgeProps) {
  return (
    <button
      onClick={onClick}
      title="What's New"
      style={{
        position: "relative",
        background: "transparent",
        border: `1px solid ${t.border}`,
        borderRadius: 8,
        width: 30,
        height: 30,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        transition: "all 0.15s",
        flexShrink: 0,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = t.borderHover;
        e.currentTarget.style.background = t.surfaceHover;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = t.border;
        e.currentTarget.style.background = "transparent";
      }}
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke={hasNew ? t.accentPrimary : t.textMuted}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>

      {/* Notification dot */}
      {hasNew && (
        <span
          style={{
            position: "absolute",
            top: -2,
            right: -2,
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: t.accentPrimary,
            boxShadow: `0 0 6px ${t.accentPrimary}80`,
          }}
        />
      )}
    </button>
  );
}
