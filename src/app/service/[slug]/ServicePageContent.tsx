"use client";

import { useState, useCallback } from "react";
import { useUser } from "@/lib/user-context";
import { THEMES } from "@/config/themes";
import type { ServiceConfig } from "@/config/services";
import type { LiveServiceDetail } from "@/lib/live-fetch";
import AppHeader from "@/components/AppHeader";
import AppFooter from "@/components/AppFooter";
import SignInModal from "@/components/SignInModal";
import Link from "next/link";

interface FAQ {
  question: string;
  answer: string;
}

interface ServicePageContentProps {
  config: ServiceConfig;
  detail: LiveServiceDetail | null;
  faqs: FAQ[];
  relatedServices: ServiceConfig[];
}

function formatStatus(status: string): string {
  switch (status) {
    case "OPERATIONAL": return "Operational";
    case "DEGRADED": return "Degraded Performance";
    case "PARTIAL_OUTAGE": return "Partial Outage";
    case "MAJOR_OUTAGE": return "Major Outage";
    case "MAINTENANCE": return "Under Maintenance";
    default: return "Unknown";
  }
}

function statusColor(status: string): string {
  switch (status) {
    case "OPERATIONAL": return "#22c55e";
    case "DEGRADED": return "#f59e0b";
    case "PARTIAL_OUTAGE": return "#f97316";
    case "MAJOR_OUTAGE": return "#ef4444";
    case "MAINTENANCE": return "#3b82f6";
    default: return "#71717a";
  }
}

function incidentStatusLabel(status: string): string {
  switch (status) {
    case "INVESTIGATING": return "Investigating";
    case "IDENTIFIED": return "Identified";
    case "MONITORING": return "Monitoring";
    case "RESOLVED": return "Resolved";
    case "POSTMORTEM": return "Postmortem";
    default: return status;
  }
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function ServicePageContent({
  config,
  detail,
  faqs,
  relatedServices,
}: ServicePageContentProps) {
  const {
    user,
    isLoading,
    isSupabaseEnabled,
    signInWithGoogle,
    signInWithGitHub,
    isInActiveProject,
    addServiceToProject,
    activeProjectId,
    preferences: { theme },
  } = useUser();
  const t = THEMES[theme];

  const [showSignIn, setShowSignIn] = useState(false);
  const [addingToProject, setAddingToProject] = useState(false);

  const currentStatus = detail?.service.currentStatus ?? "OPERATIONAL";
  const components = detail?.components ?? [];
  const incidents = detail?.incidents ?? [];
  const activeIncidents = incidents.filter((i) => i.status !== "RESOLVED");
  const recentResolved = incidents.filter((i) => i.status === "RESOLVED").slice(0, 5);

  const isDown = currentStatus !== "OPERATIONAL";
  const alreadyMonitoring = !isLoading && !!user && isInActiveProject(config.slug);

  const handleAddService = useCallback(async () => {
    if (!activeProjectId) {
      window.location.href = `/dashboard?service=${config.slug}`;
      return;
    }
    setAddingToProject(true);
    await addServiceToProject(config.slug);
    setAddingToProject(false);
  }, [activeProjectId, addServiceToProject, config.slug]);

  const handleCTAClick = useCallback(() => {
    if (isSupabaseEnabled && !user) {
      setShowSignIn(true);
    } else {
      window.location.href = `/dashboard?service=${config.slug}`;
    }
  }, [isSupabaseEnabled, user, config.slug]);

  /* ─── Reusable CTA button styles ─── */
  const ctaBtnStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    background: t.ctaBg,
    color: t.ctaText,
    padding: "10px 24px",
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 600,
    border: "none",
    cursor: "pointer",
    fontFamily: "var(--font-sans)",
    transition: "all 0.2s ease",
    boxShadow: `0 0 20px ${t.ctaBg}30`,
  };

  const ctaHover = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.transform = "translateY(-1px)";
    e.currentTarget.style.boxShadow = `0 0 30px ${t.ctaBg}50`;
  };
  const ctaUnhover = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.transform = "translateY(0)";
    e.currentTarget.style.boxShadow = `0 0 20px ${t.ctaBg}30`;
  };

  /* ─── Inline CTA renderer (reused in post-hero + main CTA) ─── */
  function renderCTAButtons(variant: "compact" | "full") {
    if (isLoading) return null;

    if (alreadyMonitoring) {
      return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={t.accentGreen} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span style={{ fontSize: 13, fontWeight: 600, color: t.accentGreen }}>
            You&apos;re monitoring {config.name}
          </span>
        </div>
      );
    }

    if (user) {
      return (
        <div style={{ textAlign: "center" }}>
          <button
            onClick={handleAddService}
            style={{
              ...ctaBtnStyle,
              opacity: addingToProject ? 0.7 : 1,
              pointerEvents: addingToProject ? "none" : "auto",
            }}
            onMouseEnter={ctaHover}
            onMouseLeave={ctaUnhover}
          >
            {addingToProject ? "Adding..." : `Add ${config.name} to My Dashboard`}
          </button>
          {variant === "full" && (
            <p style={{ fontSize: 12, color: t.textMuted, marginTop: 12 }}>
              or <Link href="/dashboard" style={{ color: t.accentPrimary, textDecoration: "none" }}>go to Dashboard</Link>
            </p>
          )}
        </div>
      );
    }

    if (isSupabaseEnabled) {
      if (variant === "compact") {
        return (
          <div style={{ textAlign: "center" }}>
            <button onClick={handleCTAClick} style={ctaBtnStyle} onMouseEnter={ctaHover} onMouseLeave={ctaUnhover}>
              {isDown ? "Get Recovery Alerts \u2014 Free" : "Start Monitoring \u2014 Free"}
            </button>
            <p style={{ fontSize: 11, color: t.textMuted, fontFamily: "var(--font-mono)", marginTop: 8, opacity: 0.6 }}>
              One click sign-up &middot; no credit card
            </p>
          </div>
        );
      }

      // Full variant — inline auth buttons
      return (
        <div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 320, margin: "0 auto" }}>
            <button
              onClick={signInWithGoogle}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                padding: "11px 20px", borderRadius: 10, border: `1px solid ${t.border}`,
                background: t.bg, color: t.text, fontSize: 14, fontWeight: 600,
                fontFamily: "var(--font-sans)", cursor: "pointer", transition: "all 0.15s", width: "100%",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = t.borderHover; e.currentTarget.style.background = t.surfaceHover; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.background = t.bg; }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Continue with Google
            </button>
            <button
              onClick={signInWithGitHub}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                padding: "11px 20px", borderRadius: 10, border: `1px solid ${t.border}`,
                background: t.bg, color: t.text, fontSize: 14, fontWeight: 600,
                fontFamily: "var(--font-sans)", cursor: "pointer", transition: "all 0.15s", width: "100%",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = t.borderHover; e.currentTarget.style.background = t.surfaceHover; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.background = t.bg; }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill={t.text}>
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              Continue with GitHub
            </button>
          </div>
          <p style={{ fontSize: 11, color: t.textMuted, fontFamily: "var(--font-mono)", marginTop: 14, opacity: 0.6, textAlign: "center" }}>
            One click &middot; 14-day Pro trial &middot; No credit card
          </p>
        </div>
      );
    }

    // Supabase disabled fallback
    return (
      <Link
        href={`/dashboard?service=${config.slug}`}
        style={{
          ...ctaBtnStyle,
          textDecoration: "none",
        }}
      >
        Open Dashboard
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="5" y1="12" x2="19" y2="12" />
          <polyline points="12 5 19 12 12 19" />
        </svg>
      </Link>
    );
  }

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
          <nav style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Link
              href="/dashboard"
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: t.textSecondary,
                textDecoration: "none",
                padding: "6px 14px",
                borderRadius: 8,
                transition: "color 0.15s",
              }}
            >
              Dashboard
            </Link>
            {isSupabaseEnabled && !user && !isLoading && (
              <button
                onClick={() => setShowSignIn(true)}
                style={{
                  background: t.accentPrimary,
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  padding: "7px 16px",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "var(--font-sans)",
                  transition: "opacity 0.15s",
                  marginLeft: 4,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
              >
                Sign In
              </button>
            )}
            {user && (
              <Link
                href="/dashboard"
                style={{
                  background: t.accentPrimary,
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  padding: "7px 16px",
                  fontSize: 13,
                  fontWeight: 600,
                  textDecoration: "none",
                  fontFamily: "var(--font-sans)",
                  marginLeft: 4,
                }}
              >
                My Dashboard
              </Link>
            )}
          </nav>
        }
      />

      <main style={{ maxWidth: 880, margin: "0 auto", padding: "32px 24px 0" }}>
        {/* ═══ 1. Hero status section ═══ */}
        <section style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20, flexWrap: "wrap" }}>
            {config.logoUrl && (
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: t.logoBg,
                  border: `1px solid ${t.logoBorder}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                  flexShrink: 0,
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={config.logoUrl}
                  alt={`${config.name} logo`}
                  width={28}
                  height={28}
                  style={{ objectFit: "contain" }}
                />
              </div>
            )}
            <div>
              <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.5, margin: 0, color: t.textHeading }}>
                {config.name} Status
              </h1>
              <p style={{ fontSize: 13, color: t.textMuted, margin: "4px 0 0", fontFamily: "var(--font-mono)" }}>
                {config.category}
              </p>
            </div>
          </div>

          {/* Status banner */}
          <div
            style={{
              padding: "16px 20px",
              borderRadius: 12,
              background: currentStatus === "OPERATIONAL" ? t.bannerOkBg : t.bannerIssueBg,
              border: `1px solid ${currentStatus === "OPERATIONAL" ? t.bannerOkBorder : t.bannerIssueBorder}`,
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: "50%",
                background: statusColor(currentStatus),
                boxShadow: `0 0 8px ${statusColor(currentStatus)}60`,
                flexShrink: 0,
              }}
            />
            <div>
              <p style={{ fontSize: 16, fontWeight: 600, margin: 0, color: t.text }}>
                {config.name} is currently {formatStatus(currentStatus).toLowerCase()}
              </p>
              {detail?.service.lastPolledAt && (
                <p style={{ fontSize: 12, color: t.textMuted, margin: "4px 0 0", fontFamily: "var(--font-mono)" }}>
                  Last checked {timeAgo(detail.service.lastPolledAt)}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* ═══ 2. Post-Hero CTA ═══ */}
        <section style={{ marginBottom: 40, textAlign: "center" }}>
          <div
            style={{
              padding: "24px 20px",
              borderRadius: 12,
              background: t.surface,
              border: `1px solid ${t.border}`,
            }}
          >
            <p style={{ fontSize: 16, fontWeight: 700, margin: "0 0 6px", color: t.textHeading }}>
              {isDown
                ? `Get alerted when ${config.name} recovers`
                : `Monitor ${config.name} + 47 services in one dashboard`}
            </p>
            <p style={{ fontSize: 13, color: t.textSecondary, margin: "0 0 16px" }}>
              {isDown
                ? "StatusHub checks every 60 seconds. Know the moment it\u2019s back."
                : "Real-time status, incident alerts, and outage history \u2014 all in one place."}
            </p>
            {renderCTAButtons("compact")}
          </div>
        </section>

        {/* ═══ 3. Active incidents ═══ */}
        {activeIncidents.length > 0 && (
          <section style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16, color: t.textHeading }}>
              Active Incidents
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {activeIncidents.map((incident) => (
                <div
                  key={incident.id}
                  style={{
                    padding: "16px 20px",
                    borderRadius: 12,
                    background: t.surface,
                    border: `1px solid ${t.border}`,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        padding: "2px 8px",
                        borderRadius: 4,
                        background: `${statusColor(incident.impact === "CRITICAL" ? "MAJOR_OUTAGE" : incident.impact === "MAJOR" ? "PARTIAL_OUTAGE" : "DEGRADED")}18`,
                        color: statusColor(incident.impact === "CRITICAL" ? "MAJOR_OUTAGE" : incident.impact === "MAJOR" ? "PARTIAL_OUTAGE" : "DEGRADED"),
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      {incidentStatusLabel(incident.status)}
                    </span>
                    <span style={{ fontSize: 12, color: t.textMuted, fontFamily: "var(--font-mono)" }}>
                      {timeAgo(incident.startedAt)}
                    </span>
                  </div>
                  <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0, color: t.text }}>
                    {incident.title}
                  </h3>
                  {incident.updates[0]?.body && (
                    <p style={{ fontSize: 13, color: t.textSecondary, marginTop: 8, lineHeight: 1.6 }}>
                      {incident.updates[0].body.length > 300
                        ? incident.updates[0].body.slice(0, 300) + "..."
                        : incident.updates[0].body}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ═══ 4. Component status grid ═══ */}
        {components.length > 0 && (
          <section style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16, color: t.textHeading }}>
              Component Status
            </h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
                gap: 8,
              }}
            >
              {components.slice(0, 30).map((comp) => (
                <div
                  key={comp.name}
                  style={{
                    padding: "12px 16px",
                    borderRadius: 8,
                    background: t.surface,
                    border: `1px solid ${t.borderSubtle}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 8,
                  }}
                >
                  <span style={{ fontSize: 13, color: t.text, fontWeight: 500 }}>
                    {comp.name}
                  </span>
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: statusColor(comp.status),
                      flexShrink: 0,
                    }}
                    title={formatStatus(comp.status)}
                  />
                </div>
              ))}
            </div>
            {components.length > 30 && (
              <p style={{ fontSize: 12, color: t.textMuted, marginTop: 8 }}>
                + {components.length - 30} more components
              </p>
            )}
          </section>
        )}

        {/* ═══ 5. Why StatusHub? ═══ */}
        <section style={{ marginBottom: 40 }}>
          <div
            style={{
              padding: "32px 28px",
              borderRadius: 16,
              background: t.surface,
              border: `1px solid ${t.border}`,
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Top accent line */}
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, transparent, ${t.accentPrimary}30, transparent)` }} />

            <h2 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 20px", color: t.textHeading }}>
              Why use StatusHub?
            </h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                gap: 16,
              }}
            >
              {[
                { title: "One dashboard for your entire stack", sub: "48 services, organized by category" },
                { title: "60-second refresh cycle", sub: "Always current, never stale" },
                { title: "Incident timelines & history", sub: "See what happened and when" },
                { title: "Instant outage alerts", sub: "Know before your users do" },
              ].map((item) => (
                <div key={item.title} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={t.accentGreen} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}>
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: t.text, margin: 0 }}>{item.title}</p>
                    <p style={{ fontSize: 12, color: t.textMuted, margin: "2px 0 0" }}>{item.sub}</p>
                  </div>
                </div>
              ))}
            </div>
            <p style={{ fontSize: 12, fontWeight: 600, color: t.textMuted, fontFamily: "var(--font-mono)", marginTop: 20, textAlign: "center" }}>
              69,000+ status checks processed daily
            </p>
          </div>
        </section>

        {/* ═══ 6. Recent resolved incidents ═══ */}
        {recentResolved.length > 0 && (
          <section style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16, color: t.textHeading }}>
              Recent Incidents
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {recentResolved.map((incident) => (
                <div
                  key={incident.id}
                  style={{
                    padding: "12px 16px",
                    borderRadius: 8,
                    background: t.surface,
                    border: `1px solid ${t.borderSubtle}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: "#22c55e",
                        flexShrink: 0,
                      }}
                    />
                    <span style={{ fontSize: 13, color: t.textSecondary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {incident.title}
                    </span>
                  </div>
                  <span style={{ fontSize: 11, color: t.textMuted, fontFamily: "var(--font-mono)", flexShrink: 0 }}>
                    {timeAgo(incident.startedAt)}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ═══ 7. FAQ section (with 5th FAQ appended) ═══ */}
        <section style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16, color: t.textHeading }}>
            Frequently Asked Questions
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {faqs.map((faq, i) => (
              <details
                key={i}
                style={{
                  padding: "16px 20px",
                  borderRadius: 12,
                  background: t.surface,
                  border: `1px solid ${t.borderSubtle}`,
                  cursor: "pointer",
                }}
              >
                <summary style={{ fontSize: 14, fontWeight: 600, color: t.text, listStyle: "none", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  {faq.question}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={t.textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </summary>
                <p style={{ fontSize: 13, color: t.textSecondary, marginTop: 12, lineHeight: 1.7 }}>
                  {faq.answer}
                </p>
              </details>
            ))}
            {/* 5th FAQ — positions StatusHub's value */}
            <details
              style={{
                padding: "16px 20px",
                borderRadius: 12,
                background: t.surface,
                border: `1px solid ${t.borderSubtle}`,
                cursor: "pointer",
              }}
            >
              <summary style={{ fontSize: 14, fontWeight: 600, color: t.text, listStyle: "none", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                Why use StatusHub instead of {config.name}&apos;s official status page?
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={t.textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </summary>
              <p style={{ fontSize: 13, color: t.textSecondary, marginTop: 12, lineHeight: 1.7 }}>
                {config.name}&apos;s official status page only shows {config.name}. StatusHub aggregates {config.name} alongside 47 other cloud services in one dashboard, so you can see your entire stack at a glance. Plus, StatusHub adds features the official page lacks: custom project boards, cross-service incident correlation, and real-time alerts when any of your services go down.
              </p>
            </details>
          </div>
        </section>

        {/* ═══ 8. Main CTA section (redesigned) ═══ */}
        <section
          style={{
            padding: "32px",
            borderRadius: 16,
            background: t.surface,
            border: `1px solid ${t.border}`,
            textAlign: "center",
            marginBottom: 40,
          }}
        >
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 8px", color: t.textHeading }}>
            {isDown
              ? `Don\u2019t keep refreshing. Get notified when ${config.name} is back.`
              : `${config.name} is up. Monitor it so you\u2019re first to know when it\u2019s not.`}
          </h2>
          <p style={{ fontSize: 14, color: t.textSecondary, marginBottom: 24, maxWidth: 480, marginLeft: "auto", marginRight: "auto" }}>
            {isDown
              ? `StatusHub checks every 60 seconds. Add ${config.name} to your dashboard and we\u2019ll alert you the moment it recovers.`
              : `Track ${config.name} alongside 47 other cloud services. Real-time updates, incident history, and instant alerts.`}
          </p>
          {renderCTAButtons("full")}
        </section>

        {/* ═══ 9. Related services ═══ */}
        {relatedServices.length > 0 && (
          <section style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: t.textHeading }}>
              Also monitor these with StatusHub
            </h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {relatedServices.map((s) => (
                <Link
                  key={s.slug}
                  href={`/service/${s.slug}`}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 8,
                    border: `1px solid ${t.border}`,
                    background: t.surface,
                    color: t.textSecondary,
                    fontSize: 13,
                    fontWeight: 500,
                    textDecoration: "none",
                    transition: "all 0.15s",
                  }}
                >
                  {s.name} Status
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ═══ 10. Official status page link ═══ */}
        <section style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 12, color: t.textMuted, textAlign: "center" }}>
            Data sourced from the official{" "}
            <a
              href={config.statusPageUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: t.accentPrimary, textDecoration: "none" }}
            >
              {config.name} status page
            </a>
          </p>
        </section>

      </main>

      {/* ═══ 11. Bottom alert banner (above footer) ═══ */}
      {!alreadyMonitoring && !isLoading && (
        <div
          style={{
            borderTop: `1px solid ${t.border}`,
            padding: "16px 24px",
            background: t.surface,
          }}
        >
          <div
            style={{
              maxWidth: 880,
              margin: "0 auto",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0, flex: 1 }}>
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: statusColor(currentStatus),
                  boxShadow: `0 0 6px ${statusColor(currentStatus)}60`,
                  flexShrink: 0,
                }}
              />
              <span style={{ fontSize: 13, fontWeight: 500, color: t.text }}>
                {isDown
                  ? `Get alerted when ${config.name} recovers`
                  : `Never miss a ${config.name} outage`}
              </span>
            </div>
            <button
              onClick={user ? handleAddService : handleCTAClick}
              style={{
                background: t.ctaBg,
                color: t.ctaText,
                padding: "8px 20px",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                border: "none",
                cursor: "pointer",
                fontFamily: "var(--font-sans)",
                transition: "all 0.15s",
                opacity: addingToProject ? 0.7 : 1,
                pointerEvents: addingToProject ? "none" : "auto",
                flexShrink: 0,
              }}
            >
              {addingToProject ? "Adding..." : user ? "Add to Dashboard" : "Get Free Alerts"}
            </button>
          </div>
        </div>
      )}

      <AppFooter t={t}>
        <Link href="/dashboard" style={{ fontSize: 11, color: t.footerColor, fontFamily: "var(--font-mono)", textDecoration: "none" }}>
          Dashboard
        </Link>
        <Link
          href={`/service/${config.slug}`}
          style={{ fontSize: 11, color: t.footerColor, fontFamily: "var(--font-mono)", textDecoration: "none" }}
        >
          {config.name} Status
        </Link>
        {relatedServices.slice(0, 4).map((s) => (
          <Link
            key={s.slug}
            href={`/service/${s.slug}`}
            style={{ fontSize: 11, color: t.footerColor, fontFamily: "var(--font-mono)", textDecoration: "none" }}
          >
            {s.name}
          </Link>
        ))}
      </AppFooter>

      {/* ═══ 12. SignInModal ═══ */}
      {showSignIn && <SignInModal t={t} onClose={() => setShowSignIn(false)} />}
    </div>
  );
}
