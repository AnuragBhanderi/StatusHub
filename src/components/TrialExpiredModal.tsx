"use client";

import type { Theme } from "@/config/themes";
import type { Plan } from "@/lib/subscription";
import { getPlanLimits } from "@/lib/subscription";
import type { Project } from "@/lib/types/supabase";

interface TrialExpiredModalProps {
  projects: Project[];
  plan: Plan;
  onUpgrade: () => void;
  onManageServices: () => void;
  onClose: () => void;
  t: Theme;
}

export default function TrialExpiredModal({
  projects,
  plan,
  onUpgrade,
  onManageServices,
  onClose,
  t,
}: TrialExpiredModalProps) {
  const limits = getPlanLimits(plan);
  const totalServices = projects.reduce((sum, p) => sum + p.service_slugs.length, 0);
  const defaultProject = projects.find((p) => p.is_default);

  const overLimitProjects = Math.max(0, projects.length - limits.maxProjects);
  const overLimitServices = defaultProject
    ? Math.max(0, defaultProject.service_slugs.length - limits.maxServicesPerProject)
    : 0;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 300,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(8px)",
        padding: 24,
      }}
    >
      <div
        className="animate-scale-in"
        style={{
          background: t.surface,
          border: `1px solid ${t.border}`,
          borderRadius: 20,
          maxWidth: 440,
          width: "100%",
          boxShadow: `0 24px 80px rgba(0,0,0,0.35)`,
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div style={{
          background: `linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)`,
          padding: "28px 24px 22px",
          position: "relative",
          overflow: "hidden",
        }}>
          <div style={{ position: "absolute", top: -30, right: -30, width: 100, height: 100, borderRadius: "50%", background: "rgba(255,255,255,0.08)" }} />
          <div style={{ position: "relative", zIndex: 1 }}>
            <h2 style={{
              margin: 0,
              fontSize: 20,
              fontWeight: 800,
              color: "#fff",
              fontFamily: "var(--font-sans)",
              lineHeight: 1.3,
            }}>
              Your Pro trial has ended
            </h2>
            <p style={{
              margin: "6px 0 0",
              fontSize: 13,
              color: "rgba(255,255,255,0.75)",
              fontFamily: "var(--font-sans)",
              lineHeight: 1.5,
            }}>
              Your data is safe — nothing was deleted.
            </p>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: "20px 24px" }}>
          {/* What changed */}
          <div style={{
            fontSize: 12,
            fontWeight: 600,
            color: t.textSecondary,
            fontFamily: "var(--font-sans)",
            marginBottom: 12,
          }}>
            What changed:
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
            {overLimitProjects > 0 && (
              <LimitRow
                label="Projects"
                current={projects.length}
                allowed={limits.maxProjects}
                extra={`${overLimitProjects} read-only`}
                t={t}
              />
            )}
            {overLimitServices > 0 && (
              <LimitRow
                label="Services monitored"
                current={defaultProject?.service_slugs.length || 0}
                allowed={limits.maxServicesPerProject}
                extra={`${overLimitServices} paused`}
                t={t}
              />
            )}
            {overLimitProjects === 0 && overLimitServices === 0 && (
              <div style={{
                fontSize: 12,
                color: t.textMuted,
                fontFamily: "var(--font-sans)",
                padding: "8px 12px",
                background: t.tagBg,
                borderRadius: 8,
              }}>
                You&apos;re within free plan limits. No changes needed.
              </div>
            )}
          </div>

          <div style={{
            fontSize: 11,
            color: t.textMuted,
            fontFamily: "var(--font-sans)",
            lineHeight: 1.5,
            marginBottom: 20,
          }}>
            Email alerts are only sent for the first {limits.maxServicesPerProject} services in your default project. You can reorder or remove services to choose which ones stay active.
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => { onClose(); onUpgrade(); }}
              style={{
                flex: 1,
                padding: "10px 0",
                borderRadius: 10,
                border: "none",
                background: `linear-gradient(135deg, ${t.accentPrimary}, ${t.accentSecondary})`,
                color: "#fff",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "var(--font-sans)",
              }}
            >
              Upgrade to Pro
            </button>
            <button
              onClick={() => { onClose(); onManageServices(); }}
              style={{
                flex: 1,
                padding: "10px 0",
                borderRadius: 10,
                border: `1px solid ${t.border}`,
                background: "transparent",
                color: t.textSecondary,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "var(--font-sans)",
              }}
            >
              Manage Services
            </button>
          </div>

          {/* Dismiss */}
          <div style={{ textAlign: "center", marginTop: 12 }}>
            <button
              onClick={onClose}
              style={{
                background: "transparent",
                border: "none",
                color: t.textMuted,
                fontSize: 11,
                cursor: "pointer",
                fontFamily: "var(--font-sans)",
                padding: "4px 8px",
              }}
            >
              Continue on Free
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function LimitRow({ label, current, allowed, extra, t }: {
  label: string;
  current: number;
  allowed: number;
  extra: string;
  t: Theme;
}) {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "8px 12px",
      background: "#ef444408",
      border: "1px solid #ef444420",
      borderRadius: 8,
    }}>
      <span style={{
        fontSize: 12,
        color: t.text,
        fontFamily: "var(--font-sans)",
        fontWeight: 500,
      }}>
        {label}
      </span>
      <span style={{
        fontSize: 11,
        fontFamily: "var(--font-mono)",
        color: "#ef4444",
        fontWeight: 600,
      }}>
        {current}/{allowed} ({extra})
      </span>
    </div>
  );
}
