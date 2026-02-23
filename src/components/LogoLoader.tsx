"use client";

import { useState, useEffect } from "react";
import { THEMES } from "@/config/themes";
import type { ThemeKey } from "@/config/themes";

export default function LogoLoader() {
  const [theme, setTheme] = useState<ThemeKey>("dark");

  useEffect(() => {
    const saved = localStorage.getItem("statushub_theme") as ThemeKey | null;
    if (saved && THEMES[saved]) setTheme(saved);
  }, []);

  const t = THEMES[theme];

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: t.bg,
      }}
    >
      {/* Logo with breathing animation */}
      <div className="sh-logo-breathe">
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 14,
            background: `linear-gradient(135deg, ${t.accentPrimary} 0%, ${t.accentSecondary} 50%, ${t.accentGreen} 100%)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: `0 4px 24px ${t.accentPrimary}30`,
          }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <path
              d="M2 12h4l3-7 5 14 3-7h5"
              stroke="#fff"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      {/* Brand text */}
      <span
        style={{
          marginTop: 16,
          fontSize: 16,
          fontWeight: 600,
          color: t.textMuted,
          letterSpacing: -0.3,
          fontFamily: "var(--font-sans), 'DM Sans', sans-serif",
        }}
      >
        StatusHub
      </span>
    </div>
  );
}
