"use client";

import { useState } from "react";
import type { Theme } from "@/config/themes";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  t: Theme;
}

export default function SearchBar({ value, onChange, t }: SearchBarProps) {
  const [focused, setFocused] = useState(false);

  return (
    <div style={{ position: "relative", marginBottom: 16 }}>
      <svg
        style={{
          position: "absolute",
          left: 14,
          top: "50%",
          transform: "translateY(-50%)",
          pointerEvents: "none",
        }}
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke={t.textFaint}
        strokeWidth="2.5"
        strokeLinecap="round"
      >
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
      <input
        type="text"
        placeholder="Search services..."
        aria-label="Search services"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: "100%",
          padding: "12px 38px 12px 40px",
          borderRadius: 12,
          border: `1px solid ${focused ? t.accentPrimary + "66" : t.border}`,
          fontSize: 14,
          fontFamily: "var(--font-sans)",
          outline: "none",
          background: t.searchBg,
          color: t.searchText,
          transition: "all 0.2s",
        }}
      />
      {value && (
        <button
          onClick={() => onChange("")}
          aria-label="Clear search"
          style={{
            position: "absolute",
            right: 10,
            top: "50%",
            transform: "translateY(-50%)",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 4,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: t.textFaint,
            borderRadius: 6,
            transition: "color 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = t.textSecondary)}
          onMouseLeave={(e) => (e.currentTarget.style.color = t.textFaint)}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}
    </div>
  );
}
