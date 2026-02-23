"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import type { Theme } from "@/config/themes";

interface AppHeaderProps {
  t: Theme;
  showBeta?: boolean;
  rightContent?: ReactNode;
}

export default function AppHeader({ t, showBeta, rightContent }: AppHeaderProps) {
  return (
    <header
      style={{
        background: t.headerBg,
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: `1px solid ${t.border}`,
        padding: "14px 0",
        position: "sticky",
        top: 0,
        zIndex: 100,
        transition: "background 0.3s ease",
      }}
    >
      <div
        className="sh-header-inner"
        style={{
          maxWidth: 1120,
          margin: "0 auto",
          padding: "0 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Link
            href="/"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              textDecoration: "none",
              cursor: "pointer",
            }}
          >
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                background: `linear-gradient(135deg, ${t.accentPrimary} 0%, ${t.accentGreen} 100%)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontSize: 14,
                fontWeight: 700,
                fontFamily: "var(--font-mono)",
                flexShrink: 0,
              }}
            >
              S
            </div>
            <span
              className="sh-header-logo"
              style={{
                fontWeight: 700,
                fontSize: 18,
                color: t.text,
                letterSpacing: -0.5,
              }}
            >
              StatusHub
            </span>
          </Link>
          {showBeta && (
            <span
              className="sh-header-beta"
              style={{
                fontSize: 9,
                fontWeight: 700,
                color: t.betaText,
                background: t.betaBg,
                padding: "2px 7px",
                borderRadius: 4,
                fontFamily: "var(--font-mono)",
                letterSpacing: 1.5,
                flexShrink: 0,
              }}
            >
              BETA
            </span>
          )}
        </div>
        {rightContent}
      </div>
    </header>
  );
}
