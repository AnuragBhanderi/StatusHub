"use client";

import { useState, forwardRef } from "react";
import type { Theme } from "@/config/themes";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  t: Theme;
}

const SearchBar = forwardRef<HTMLInputElement, SearchBarProps>(
  function SearchBar({ value, onChange, t }, ref) {
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
          width="15"
          height="15"
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
          ref={ref}
          type="text"
          className="sh-search-input"
          placeholder="Search services..."
          aria-label="Search services"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width: "100%",
            padding: "11px 70px 11px 40px",
            borderRadius: 8,
            border: `1px solid ${focused ? t.accentPrimary + "50" : t.border}`,
            fontSize: 14,
            fontFamily: "var(--font-sans)",
            outline: "none",
            background: t.searchBg,
            color: t.searchText,
            transition: "all 0.2s",
            boxShadow: "none",
          }}
        />
        {!value && (
          <div
            style={{
              position: "absolute",
              right: 12,
              top: "50%",
              transform: "translateY(-50%)",
              display: "flex",
              alignItems: "center",
              gap: 3,
              pointerEvents: "none",
            }}
          >
            <kbd
              style={{
                fontSize: 10,
                fontFamily: "var(--font-mono)",
                color: t.textFaint,
                background: t.tagBg,
                border: `1px solid ${t.border}`,
                borderRadius: 4,
                padding: "2px 5px",
                lineHeight: 1,
              }}
            >
              ⌘
            </kbd>
            <kbd
              style={{
                fontSize: 10,
                fontFamily: "var(--font-mono)",
                color: t.textFaint,
                background: t.tagBg,
                border: `1px solid ${t.border}`,
                borderRadius: 4,
                padding: "2px 5px",
                lineHeight: 1,
              }}
            >
              K
            </kbd>
          </div>
        )}
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
              borderRadius: 4,
              transition: "color 0.15s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.color = t.textSecondary)
            }
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
);

export default SearchBar;