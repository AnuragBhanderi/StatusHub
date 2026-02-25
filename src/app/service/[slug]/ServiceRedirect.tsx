"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/lib/user-context";
import { THEMES } from "@/config/themes";
import AppHeader from "@/components/AppHeader";

export default function ServiceRedirect({ slug }: { slug: string }) {
  const router = useRouter();
  const { preferences: { theme } } = useUser();
  const t = THEMES[theme];

  useEffect(() => {
    router.push(`/dashboard?service=${slug}`);
  }, [slug, router]);

  return (
    <div
      className="theme-transition"
      style={{
        minHeight: "100vh",
        background: t.bg,
        fontFamily: "var(--font-sans)",
        color: t.text,
      }}
    >
      <AppHeader
        t={t}
        rightContent={
          <button
            onClick={() => router.push("/dashboard")}
            style={{
              background: "transparent",
              border: `1px solid ${t.border}`,
              borderRadius: 8,
              padding: "6px 14px",
              fontSize: 12,
              fontWeight: 600,
              color: t.textSecondary,
              cursor: "pointer",
              fontFamily: "var(--font-sans)",
              transition: "all 0.15s",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            Dashboard
          </button>
        }
      />
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "80px 24px",
          color: t.textMuted,
          fontSize: 14,
          fontFamily: "var(--font-mono)",
        }}
      >
        Redirecting...
      </div>
    </div>
  );
}
