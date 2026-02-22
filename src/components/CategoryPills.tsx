"use client";

import type { Theme } from "@/config/themes";

interface CategoryPillsProps {
  categories: string[];
  active: string;
  onChange: (category: string) => void;
  t: Theme;
}

export default function CategoryPills({
  categories,
  active,
  onChange,
  t,
}: CategoryPillsProps) {
  const all = ["All", ...categories];

  return (
    <div
      className="sh-pills"
      style={{
        display: "flex",
        gap: 6,
        marginBottom: 24,
        overflowX: "auto",
        paddingBottom: 4,
        WebkitOverflowScrolling: "touch",
        msOverflowStyle: "none",
        scrollbarWidth: "none",
      }}
    >
      {all.map((cat) => {
        const isActive = active === cat;
        return (
          <button
            key={cat}
            onClick={() => onChange(cat)}
            style={{
              padding: "6px 14px",
              borderRadius: 6,
              border: `1px solid ${isActive ? t.pillActiveBorder : t.pillBorder}`,
              background: isActive ? t.pillActiveBg : t.pillBg,
              color: isActive ? t.pillActiveText : t.pillText,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              whiteSpace: "nowrap",
              fontFamily: "var(--font-sans)",
              transition: "all 0.15s",
              flexShrink: 0,
            }}
          >
            {cat}
          </button>
        );
      })}
    </div>
  );
}
