"use client";

import { useState, useRef, useEffect } from "react";
import type { Theme, ThemeKey } from "@/config/themes";
import { THEMES } from "@/config/themes";

interface ThemeSwitcherProps {
  theme: ThemeKey;
  setTheme: (theme: ThemeKey) => void;
  t: Theme;
}

function ThemeIcon({
  themeKey,
  active,
  t,
}: {
  themeKey: string;
  active: boolean;
  t: Theme;
}) {
  const color = active ? t.accentPrimary : t.textMuted;

  if (themeKey === "light") {
    return (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="5" />
        <line x1="12" y1="1" x2="12" y2="3" />
        <line x1="12" y1="21" x2="12" y2="23" />
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
        <line x1="1" y1="12" x2="3" y2="12" />
        <line x1="21" y1="12" x2="23" y2="12" />
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
      </svg>
    );
  }

  if (themeKey === "midnight") {
    return (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    );
  }

  // dark (moon)
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

export default function ThemeSwitcher({
  theme,
  setTheme,
  t,
}: ThemeSwitcherProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const keys = Object.keys(THEMES) as ThemeKey[];
  const currentTheme = THEMES[theme];

  return (
    <div ref={ref} style={{ position: "relative" }}>
      {/* Trigger Button */}
      <button
        onClick={() => setOpen(!open)}
        aria-label={`Theme: ${currentTheme.name}. Click to change.`}
        aria-expanded={open}
        aria-haspopup="listbox"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "7px 12px",
          borderRadius: 10,
          border: `1px solid ${t.border}`,
          background: t.surface,
          cursor: "pointer",
          transition: "all 0.2s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = t.borderHover;
          e.currentTarget.style.background = t.surfaceHover;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = t.border;
          e.currentTarget.style.background = t.surface;
        }}
      >
        <ThemeIcon themeKey={theme} active={true} t={t} />
        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: t.textSecondary,
            fontFamily: "var(--font-sans)",
          }}
        >
          {currentTheme.name}
        </span>
        <svg
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          stroke={t.textFaint}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s ease",
          }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            right: 0,
            minWidth: 180,
            background: t.surface,
            border: `1px solid ${t.border}`,
            borderRadius: 12,
            boxShadow: t.cardShadow,
            padding: 4,
            zIndex: 200,
            animation: "fade-in 0.15s ease",
          }}
        >
          {keys.map((k) => {
            const isActive = theme === k;
            return (
              <button
                key={k}
                onClick={() => {
                  setTheme(k);
                  setOpen(false);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  width: "100%",
                  padding: "10px 12px",
                  border: "none",
                  borderRadius: 8,
                  cursor: "pointer",
                  background: isActive ? t.pillActiveBg : "transparent",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  if (!isActive)
                    e.currentTarget.style.background = t.surfaceHover;
                }}
                onMouseLeave={(e) => {
                  if (!isActive)
                    e.currentTarget.style.background = "transparent";
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: isActive
                      ? `${THEMES[k].accentPrimary}15`
                      : t.tagBg,
                    border: `1px solid ${isActive ? `${THEMES[k].accentPrimary}30` : t.border}`,
                    transition: "all 0.15s ease",
                  }}
                >
                  <ThemeIcon themeKey={k} active={isActive} t={t} />
                </div>
                <div style={{ flex: 1, textAlign: "left" }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: isActive ? t.pillActiveText : t.text,
                      fontFamily: "var(--font-sans)",
                    }}
                  >
                    {THEMES[k].name}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: t.textMuted,
                      fontFamily: "var(--font-sans)",
                      marginTop: 1,
                    }}
                  >
                    {k === "dark"
                      ? "Easy on the eyes"
                      : k === "light"
                        ? "Clean and bright"
                        : "Deep space vibes"}
                  </div>
                </div>
                {isActive && (
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={t.accentPrimary}
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
