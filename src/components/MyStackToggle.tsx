"use client";

import type { Theme } from "@/config/themes";

interface MyStackToggleProps {
  showMyStack: boolean;
  onToggle: () => void;
  count: number;
  t: Theme;
}

export default function MyStackToggle({
  showMyStack,
  onToggle,
  count,
  t,
}: MyStackToggleProps) {
  return (
    <button
      onClick={onToggle}
      aria-label={showMyStack ? "Show all services" : `Show My Stack (${count} services)`}
      aria-pressed={showMyStack}
      style={{
        background: showMyStack ? t.stackBtnBg : "transparent",
        color: showMyStack ? t.accentPrimary : t.textMuted,
        border: `1px solid ${showMyStack ? t.stackBtnBorder : t.border}`,
        borderRadius: 9,
        padding: "7px 14px",
        fontSize: 13,
        fontWeight: 600,
        cursor: "pointer",
        fontFamily: "var(--font-sans)",
        transition: "all 0.15s",
        display: "flex",
        alignItems: "center",
        gap: 6,
        flexShrink: 0,
      }}
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill={showMyStack ? t.accentPrimary : "none"}
        stroke={showMyStack ? t.accentPrimary : "currentColor"}
        strokeWidth="2"
        style={{ flexShrink: 0 }}
      >
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
      <span className="sh-mystack-label">
        My Stack{count > 0 ? ` (${count})` : ""}
      </span>
    </button>
  );
}
