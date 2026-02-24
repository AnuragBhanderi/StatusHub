"use client";

import type { Theme } from "@/config/themes";
import type { Plan, PromoInfo } from "@/lib/subscription";
import { getPlanLimits } from "@/lib/subscription";
import type { Project } from "@/lib/types/supabase";
import { useState } from "react";

interface TrialExpiryBannerProps {
  plan: Plan;
  promoInfo: PromoInfo | null;
  projects: Project[];
  onUpgrade: () => void;
  t: Theme;
}

export default function TrialExpiryBanner({
  plan,
  promoInfo,
  projects,
  onUpgrade,
  t,
}: TrialExpiryBannerProps) {
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") return false;
    const key = `statushub_trial_banner_dismissed_${new Date().toISOString().slice(0, 10)}`;
    return localStorage.getItem(key) === "true";
  });

  // Only show for active promo trials ending within 3 days
  if (!promoInfo?.isPromo || !promoInfo.trialEndsAt) return null;

  const endsAt = new Date(promoInfo.trialEndsAt);
  const now = new Date();
  const daysRemaining = Math.ceil((endsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (daysRemaining > 3 || daysRemaining < 0) return null;
  if (dismissed) return null;

  // Calculate overage info
  const freeLimits = getPlanLimits("free");
  const totalServices = projects.reduce((sum, p) => sum + p.service_slugs.length, 0);
  const overProjects = Math.max(0, projects.length - freeLimits.maxProjects);
  const overServices = projects.reduce(
    (sum, p) => sum + Math.max(0, p.service_slugs.length - freeLimits.maxServicesPerProject),
    0
  );

  function handleDismiss() {
    const key = `statushub_trial_banner_dismissed_${new Date().toISOString().slice(0, 10)}`;
    localStorage.setItem(key, "true");
    setDismissed(true);
  }

  return (
    <div
      style={{
        margin: "16px 0",
        padding: "14px 18px",
        borderRadius: 12,
        background: `linear-gradient(135deg, #f59e0b10, #f59e0b05)`,
        border: "1px solid #f59e0b30",
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}
    >
      {/* Warning icon */}
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: "#f59e0b18",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      </div>

      {/* Message */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 13,
          fontWeight: 600,
          color: t.text,
          fontFamily: "var(--font-sans)",
        }}>
          Your Pro trial ends in {daysRemaining} day{daysRemaining !== 1 ? "s" : ""}
        </div>
        {(overProjects > 0 || overServices > 0) && (
          <div style={{
            fontSize: 11,
            color: t.textMuted,
            fontFamily: "var(--font-sans)",
            marginTop: 2,
          }}>
            You have {projects.length} project{projects.length !== 1 ? "s" : ""} with {totalServices} services that exceed free limits ({freeLimits.maxProjects} project, {freeLimits.maxServicesPerProject} services).
          </div>
        )}
      </div>

      {/* Actions */}
      <button
        onClick={onUpgrade}
        style={{
          padding: "6px 14px",
          borderRadius: 8,
          border: "none",
          background: "#f59e0b",
          color: "#fff",
          fontSize: 12,
          fontWeight: 600,
          cursor: "pointer",
          fontFamily: "var(--font-sans)",
          whiteSpace: "nowrap",
          flexShrink: 0,
        }}
      >
        Upgrade
      </button>
      <button
        onClick={handleDismiss}
        style={{
          background: "transparent",
          border: "none",
          cursor: "pointer",
          color: t.textMuted,
          padding: 4,
          flexShrink: 0,
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}
