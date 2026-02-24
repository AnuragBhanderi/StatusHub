"use client";

import type { ReactNode } from "react";
import type { Theme } from "@/config/themes";

interface AppFooterProps {
  t: Theme;
  children?: ReactNode;
}

export default function AppFooter({ t, children }: AppFooterProps) {
  return (
    <footer
      style={{
        borderTop: `1px solid ${t.border}`,
        padding: "24px",
        marginTop: 80,
      }}
    >
      <div
        style={{
          maxWidth: 1120,
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 20,
              height: 20,
              borderRadius: 5,
              background: `linear-gradient(135deg, ${t.accentPrimary} 0%, ${t.accentGreen} 100%)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: 10,
              fontWeight: 700,
              fontFamily: "var(--font-mono)",
            }}
          >
            S
          </div>
          <span
            style={{
              fontSize: 12,
              color: t.footerColor,
              fontFamily: "var(--font-mono)",
            }}
          >
            StatusHub
          </span>
          {children && (
            <>
              <span style={{ fontSize: 11, color: t.footerColor, fontFamily: "var(--font-mono)" }}>·</span>
              {children}
            </>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span
            style={{
              fontSize: 11,
              color: t.footerColor,
              fontFamily: "var(--font-mono)",
            }}
          >
            &copy; {new Date().getFullYear()}
          </span>
        </div>
      </div>
    </footer>
  );
}
