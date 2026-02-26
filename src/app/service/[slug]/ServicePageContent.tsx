"use client";

import { useUser } from "@/lib/user-context";
import { THEMES } from "@/config/themes";
import type { ServiceConfig } from "@/config/services";
import type { LiveServiceDetail } from "@/lib/live-fetch";
import AppHeader from "@/components/AppHeader";
import AppFooter from "@/components/AppFooter";
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
  const { preferences: { theme } } = useUser();
  const t = THEMES[theme];

  const currentStatus = detail?.service.currentStatus ?? "OPERATIONAL";
  const components = detail?.components ?? [];
  const incidents = detail?.incidents ?? [];
  const activeIncidents = incidents.filter((i) => i.status !== "RESOLVED");
  const recentResolved = incidents.filter((i) => i.status === "RESOLVED").slice(0, 5);

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
          <Link
            href="/dashboard"
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
              textDecoration: "none",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            Dashboard
          </Link>
        }
      />

      <main style={{ maxWidth: 880, margin: "0 auto", padding: "32px 24px 0" }}>
        {/* Hero status section */}
        <section style={{ marginBottom: 40 }}>
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

        {/* Active incidents */}
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

        {/* Component status grid */}
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

        {/* Recent resolved incidents */}
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

        {/* FAQ section */}
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
          </div>
        </section>

        {/* CTA section */}
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
            Monitor {config.name} on Your Dashboard
          </h2>
          <p style={{ fontSize: 14, color: t.textSecondary, marginBottom: 20, maxWidth: 480, marginLeft: "auto", marginRight: "auto" }}>
            Track {config.name} alongside 48 other cloud services in one unified dashboard. Real-time updates, no signup required.
          </p>
          <Link
            href={`/dashboard?service=${config.slug}`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: t.ctaBg,
              color: t.ctaText,
              padding: "12px 28px",
              borderRadius: 10,
              fontSize: 15,
              fontWeight: 600,
              textDecoration: "none",
              transition: "background 0.15s",
            }}
          >
            Open Dashboard
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </Link>
        </section>

        {/* Related services */}
        {relatedServices.length > 0 && (
          <section style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: t.textHeading }}>
              Related {config.category} Services
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

        {/* Official status page link */}
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

      <AppFooter t={t}>
        <Link
          href={`/service/${config.slug}`}
          style={{ fontSize: 11, color: t.footerColor, fontFamily: "var(--font-mono)", textDecoration: "none" }}
        >
          {config.name} Status
        </Link>
      </AppFooter>
    </div>
  );
}
