"use client";

import { useState, useEffect, useMemo } from "react";
import type { Theme } from "@/config/themes";
import { STATUS_DISPLAY, IMPACT_DISPLAY, MONITORING_DISPLAY } from "@/lib/normalizer";
import StatusDot from "./StatusDot";
import LogoIcon from "./LogoIcon";

interface IncidentUpdate {
  id: string;
  status: string;
  body: string;
  createdAt: string;
}

interface Incident {
  id: string;
  title: string;
  status: string;
  impact: string;
  startedAt: string;
  resolvedAt: string | null;
  sourceUrl?: string | null;
  updates: IncidentUpdate[];
}

interface ComponentData {
  name: string;
  status: string;
}

interface ServiceDetailData {
  service: {
    id: string;
    name: string;
    slug: string;
    category: string;
    currentStatus: string;
    statusPageUrl: string;
    logoUrl: string | null;
    lastPolledAt: string | null;
  };
  components?: ComponentData[];
  incidents: Incident[];
}

interface ServiceCardData {
  id: string;
  name: string;
  slug: string;
  category: string;
  currentStatus: string;
  statusPageUrl: string;
  logoUrl: string | null;
}

interface ServiceDetailViewProps {
  service: ServiceCardData;
  onBack: () => void;
  isInStack: boolean;
  onToggleStack: () => void;
  hideStackAction?: boolean;
  t: Theme;
}

function formatTime(date: string) {
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ${mins % 60}m ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

function formatAbsoluteDate(date: string) {
  return new Date(date).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

function formatFullDate(date: string) {
  return new Date(date).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatDuration(startedAt: string) {
  const diff = Date.now() - new Date(startedAt).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "< 1m";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  const remainMins = mins % 60;
  if (hrs < 24) return `${hrs}h ${remainMins}m`;
  const days = Math.floor(hrs / 24);
  const remainHrs = hrs % 24;
  return `${days}d ${remainHrs}h`;
}

const INCIDENT_STATUS_ICON: Record<string, string> = {
  INVESTIGATING: "search",
  IDENTIFIED: "target",
  MONITORING: "eye",
  RESOLVED: "check",
  POSTMORTEM: "file",
};

function StatusIcon({
  type,
  color,
  size = 14,
}: {
  type: string;
  color: string;
  size?: number;
}) {
  const props = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: color,
    strokeWidth: "2",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  switch (type) {
    case "search":
      return (
        <svg {...props}>
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      );
    case "target":
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="6" />
          <circle cx="12" cy="12" r="2" />
        </svg>
      );
    case "eye":
      return (
        <svg {...props}>
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      );
    case "check":
      return (
        <svg {...props}>
          <polyline points="20 6 9 17 4 12" />
        </svg>
      );
    case "file":
      return (
        <svg {...props}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
        </svg>
      );
    default:
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="10" />
        </svg>
      );
  }
}

export default function ServiceDetailView({
  service,
  onBack,
  isInStack,
  onToggleStack,
  hideStackAction,
  t,
}: ServiceDetailViewProps) {
  const [detail, setDetail] = useState<ServiceDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"components" | "incidents">(
    "components"
  );
  const [expandedIncidents, setExpandedIncidents] = useState<Set<string>>(
    new Set()
  );
  const [showAllOperational, setShowAllOperational] = useState(false);
  const [copied, setCopied] = useState(false);
  const [, setDurationTick] = useState(0);

  // Tick every 30s to keep live durations fresh
  useEffect(() => {
    const timer = setInterval(() => setDurationTick((t) => t + 1), 30000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    async function fetchDetail() {
      try {
        const res = await fetch(`/api/services/${service.slug}`);
        if (res.ok) {
          const data = await res.json();
          setDetail(data);
          // Auto-switch to incidents tab if there are truly active incidents
          const hasTrulyActive = data.incidents?.some(
            (i: Incident) => !i.resolvedAt && i.status !== "MONITORING"
          );
          if (hasTrulyActive) {
            setActiveTab("incidents");
            // Auto-expand only truly active incidents
            const activeIds = new Set<string>(
              data.incidents
                .filter((i: Incident) => !i.resolvedAt && i.status !== "MONITORING")
                .map((i: Incident) => i.id)
            );
            setExpandedIncidents(activeIds);
          }
        }
      } catch {
        // API not available
      }
      setLoading(false);
    }
    fetchDetail();
  }, [service.slug]);

  const currentStatus =
    detail?.service?.currentStatus || service.currentStatus;
  const cfg = STATUS_DISPLAY[currentStatus] || STATUS_DISPLAY.OPERATIONAL;

  const components = detail?.components || [];
  const trulyActiveIncidents = useMemo(
    () => (detail?.incidents || []).filter((i) => !i.resolvedAt && i.status !== "MONITORING"),
    [detail]
  );
  const monitoringIncidents = useMemo(
    () => (detail?.incidents || []).filter((i) => !i.resolvedAt && i.status === "MONITORING"),
    [detail]
  );
  const resolvedIncidents = useMemo(
    () => (detail?.incidents || []).filter((i) => i.resolvedAt),
    [detail]
  );

  const componentHealth = useMemo(() => {
    if (components.length === 0) return null;
    const op = components.filter((c) => c.status === "OPERATIONAL").length;
    return { operational: op, total: components.length };
  }, [components]);

  const affectedComponents = useMemo(
    () => components.filter((c) => c.status !== "OPERATIONAL"),
    [components]
  );
  const operationalComponents = useMemo(
    () => components.filter((c) => c.status === "OPERATIONAL"),
    [components]
  );

  const toggleIncident = (id: string) => {
    setExpandedIncidents((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="animate-fade-in">
      {/* Back button */}
      <button
        onClick={onBack}
        style={{
          background: "none",
          border: "none",
          color: t.textMuted,
          cursor: "pointer",
          fontSize: 13,
          fontFamily: "var(--font-sans)",
          fontWeight: 500,
          padding: "6px 0",
          marginBottom: 20,
          display: "flex",
          alignItems: "center",
          gap: 6,
          transition: "color 0.15s",
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.color = t.accentPrimary)
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.color = t.textMuted)
        }
      >
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="19" y1="12" x2="5" y2="12" />
          <polyline points="12 19 5 12 12 5" />
        </svg>
        Back to dashboard
      </button>

      {/* Hero header card */}
      <div
        className="sh-banner"
        style={{
          background: t.surface,
          borderRadius: 10,
          border: `1px solid ${t.border}`,
          padding: "24px 24px 20px",
          marginBottom: 20,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Subtle gradient accent bar at top */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            background: `linear-gradient(90deg, ${cfg.color} 0%, ${cfg.color}00 100%)`,
            opacity: 0.8,
          }}
        />

        <div
          className="sh-detail-header"
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 18,
            flexWrap: "wrap",
          }}
        >
          <LogoIcon
            name={service.name}
            logoUrl={service.logoUrl}
            size={56}
            t={t}
          />
          <div style={{ flex: 1, minWidth: 160 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 8,
                flexWrap: "wrap",
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontSize: 24,
                  fontWeight: 700,
                  color: t.text,
                  fontFamily: "var(--font-sans)",
                  letterSpacing: -0.5,
                }}
              >
                {service.name}
              </h2>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: t.textMuted,
                  background: t.tagBg,
                  padding: "3px 10px",
                  borderRadius: 6,
                  fontFamily: "var(--font-mono)",
                  letterSpacing: 0.5,
                  textTransform: "uppercase",
                }}
              >
                {service.category}
              </span>
            </div>

            {/* Status badge */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background: cfg.color + "12",
                border: `1px solid ${cfg.color}25`,
                borderRadius: 8,
                padding: "6px 14px 6px 10px",
              }}
            >
              <StatusDot status={currentStatus} size={8} />
              <span
                style={{
                  color: cfg.color,
                  fontWeight: 600,
                  fontSize: 13,
                  fontFamily: "var(--font-sans)",
                }}
              >
                {cfg.label}
              </span>
            </div>

            {/* Meta info row */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                marginTop: 14,
                flexWrap: "wrap",
              }}
            >
              {detail?.service?.lastPolledAt && (
                <span
                  style={{
                    fontSize: 11,
                    color: t.textFaint,
                    fontFamily: "var(--font-mono)",
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                  }}
                >
                  <svg
                    width="11"
                    height="11"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  <span title={formatAbsoluteDate(detail.service.lastPolledAt)}>
                    Updated {formatTime(detail.service.lastPolledAt)}
                  </span>
                </span>
              )}
              <a
                href={service.statusPageUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: 11,
                  color: t.accentPrimary,
                  fontFamily: "var(--font-mono)",
                  textDecoration: "none",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  transition: "opacity 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.7")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
              >
                <svg
                  width="11"
                  height="11"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
                Official status page
              </a>
            </div>
          </div>

          <div className="sh-detail-actions" style={{ display: "flex", gap: 8, flexShrink: 0, flexWrap: "wrap" }}>
          {/* Share button */}
          <button
            onClick={() => {
              const url = `${window.location.origin}/service/${service.slug}`;
              navigator.clipboard.writeText(url).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              });
            }}
            title="Copy link to this service"
            style={{
              background: copied ? t.accentGreen + "12" : "transparent",
              color: copied ? t.accentGreen : t.textMuted,
              border: `1px solid ${copied ? t.accentGreen + "40" : t.border}`,
              borderRadius: 10,
              padding: "9px 18px",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 600,
              fontFamily: "var(--font-sans)",
              display: "flex",
              alignItems: "center",
              gap: 6,
              transition: "all 0.15s",
            }}
          >
            {copied ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
            )}
            {copied ? "Copied!" : "Share"}
          </button>

          {/* Stack button */}
          {!hideStackAction && (
            <button
              onClick={onToggleStack}
              style={{
                background: isInStack ? t.stackBtnBg : "transparent",
                color: isInStack ? t.accentPrimary : t.textMuted,
                border: `1px solid ${isInStack ? t.stackBtnBorder : t.border}`,
                borderRadius: 10,
                padding: "9px 18px",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 600,
                fontFamily: "var(--font-sans)",
                display: "flex",
                alignItems: "center",
                gap: 6,
                transition: "all 0.15s",
              }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill={isInStack ? t.accentPrimary : "none"}
                stroke={isInStack ? t.accentPrimary : "currentColor"}
                strokeWidth="2"
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              {isInStack ? "In My Stack" : "Add to Stack"}
            </button>
          )}
          </div>
        </div>
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[1, 2].map((i) => (
            <div
              key={i}
              style={{
                background: t.surface,
                borderRadius: 10,
                border: `1px solid ${t.border}`,
                padding: "24px 24px",
                opacity: 0.6 - i * 0.15,
              }}
            >
              <div
                style={{
                  height: 12,
                  width: 120,
                  borderRadius: 6,
                  background: t.logoBg,
                  marginBottom: 20,
                }}
              />
              {[1, 2, 3].map((j) => (
                <div
                  key={j}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "12px 0",
                    borderBottom:
                      j < 3 ? `1px solid ${t.divider}` : "none",
                  }}
                >
                  <div
                    style={{
                      height: 10,
                      width: 100 + j * 30,
                      borderRadius: 5,
                      background: t.logoBg,
                    }}
                  />
                  <div
                    style={{
                      height: 10,
                      width: 60,
                      borderRadius: 5,
                      background: t.logoBg,
                    }}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Main content */}
      {!loading && detail && (
        <>
          {/* Tab switcher */}
          <div
            className="sh-detail-tabs"
            style={{
              display: "flex",
              gap: 0,
              marginBottom: 16,
              borderBottom: `1px solid ${t.border}`,
              padding: 0,
            }}
          >
            <button
              onClick={() => setActiveTab("components")}
              style={{
                flex: 1,
                padding: "10px 16px",
                borderRadius: 0,
                border: "none",
                borderBottom: activeTab === "components" ? `2px solid ${t.accentPrimary}` : "2px solid transparent",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 600,
                fontFamily: "var(--font-sans)",
                background: "transparent",
                color:
                  activeTab === "components" ? t.text : t.textMuted,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                transition: "all 0.15s",
              }}
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
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
              </svg>
              Components
              {components.length > 0 && (
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color:
                      activeTab === "components"
                        ? t.textSecondary
                        : t.textFaint,
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {components.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("incidents")}
              style={{
                flex: 1,
                padding: "10px 16px",
                borderRadius: 0,
                border: "none",
                borderBottom: activeTab === "incidents" ? `2px solid ${t.accentPrimary}` : "2px solid transparent",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 600,
                fontFamily: "var(--font-sans)",
                background: "transparent",
                color:
                  activeTab === "incidents" ? t.text : t.textMuted,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                transition: "all 0.15s",
              }}
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
                <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              Incidents
              {trulyActiveIncidents.length > 0 && (
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: "#fff",
                    background: "#ef4444",
                    padding: "1px 7px",
                    borderRadius: 10,
                    fontFamily: "var(--font-mono)",
                    minWidth: 18,
                    textAlign: "center",
                  }}
                >
                  {trulyActiveIncidents.length}
                </span>
              )}
              {trulyActiveIncidents.length === 0 && monitoringIncidents.length > 0 && (
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: "#fff",
                    background: MONITORING_DISPLAY.color,
                    padding: "1px 7px",
                    borderRadius: 10,
                    fontFamily: "var(--font-mono)",
                    minWidth: 18,
                    textAlign: "center",
                  }}
                >
                  {monitoringIncidents.length}
                </span>
              )}
            </button>
          </div>

          {/* Components tab */}
          {activeTab === "components" && (
            <div className="animate-fade-in">
              {/* Banner: truly active incidents but no affected components */}
              {trulyActiveIncidents.length > 0 && affectedComponents.length === 0 && (
                <div
                  style={{
                    background: `${(IMPACT_DISPLAY[trulyActiveIncidents[0]?.impact] || IMPACT_DISPLAY.NONE).color}08`,
                    borderRadius: 10,
                    border: `1px solid ${(IMPACT_DISPLAY[trulyActiveIncidents[0]?.impact] || IMPACT_DISPLAY.NONE).color}20`,
                    padding: "16px 20px",
                    marginBottom: 12,
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 14,
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: `${(IMPACT_DISPLAY[trulyActiveIncidents[0]?.impact] || IMPACT_DISPLAY.NONE).color}14`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      marginTop: 1,
                    }}
                  >
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke={(IMPACT_DISPLAY[trulyActiveIncidents[0]?.impact] || IMPACT_DISPLAY.NONE).color}
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: t.text,
                        marginBottom: 4,
                        lineHeight: 1.4,
                      }}
                    >
                      {trulyActiveIncidents.length === 1
                        ? "Active incident not tied to a specific component"
                        : `${trulyActiveIncidents.length} active incidents not tied to specific components`}
                    </div>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 12,
                        color: t.textMuted,
                        lineHeight: 1.55,
                      }}
                    >
                      This service has {trulyActiveIncidents.length === 1 ? "an open incident" : `${trulyActiveIncidents.length} open incidents`}, but no individual components are reporting issues. The issue may affect an unlisted subsystem or is still under investigation.
                    </p>
                    <button
                      onClick={() => setActiveTab("incidents")}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: 0,
                        marginTop: 8,
                        fontSize: 12,
                        fontWeight: 600,
                        fontFamily: "var(--font-mono)",
                        color: t.accentPrimary,
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                        transition: "opacity 0.15s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.7")}
                      onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                    >
                      View {trulyActiveIncidents.length === 1 ? "incident" : "incidents"}
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}

              {/* Teal banner: monitoring-only incidents, no truly active */}
              {trulyActiveIncidents.length === 0 && monitoringIncidents.length > 0 && affectedComponents.length === 0 && (
                <div
                  style={{
                    background: `${MONITORING_DISPLAY.color}08`,
                    borderRadius: 10,
                    border: `1px solid ${MONITORING_DISPLAY.color}20`,
                    padding: "16px 20px",
                    marginBottom: 12,
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 14,
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: `${MONITORING_DISPLAY.color}14`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      marginTop: 1,
                    }}
                  >
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke={MONITORING_DISPLAY.color}
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: t.text,
                        marginBottom: 4,
                        lineHeight: 1.4,
                      }}
                    >
                      Fix deployed — monitoring {monitoringIncidents.length === 1 ? "an incident" : `${monitoringIncidents.length} incidents`}
                    </div>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 12,
                        color: t.textMuted,
                        lineHeight: 1.55,
                      }}
                    >
                      A fix has been deployed and the service is being monitored. All components are operational.
                    </p>
                    <button
                      onClick={() => setActiveTab("incidents")}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: 0,
                        marginTop: 8,
                        fontSize: 12,
                        fontWeight: 600,
                        fontFamily: "var(--font-mono)",
                        color: MONITORING_DISPLAY.color,
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                        transition: "opacity 0.15s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.7")}
                      onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                    >
                      View {monitoringIncidents.length === 1 ? "incident" : "incidents"}
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}

              {components.length > 0 ? (
                <>
                  {/* Health summary bar */}
                  {componentHealth && (
                    <div
                      style={{
                        background: t.surface,
                        borderRadius: 10,
                        border: `1px solid ${t.border}`,
                        padding: "18px 22px",
                        marginBottom: 12,
                        display: "flex",
                        alignItems: "center",
                        gap: 16,
                      }}
                    >
                      {/* Progress ring */}
                      <div style={{ position: "relative", width: 44, height: 44, flexShrink: 0 }}>
                        <svg width="44" height="44" viewBox="0 0 44 44">
                          <circle
                            cx="22"
                            cy="22"
                            r="18"
                            fill="none"
                            stroke={t.border}
                            strokeWidth="4"
                          />
                          <circle
                            cx="22"
                            cy="22"
                            r="18"
                            fill="none"
                            stroke={
                              componentHealth.operational ===
                              componentHealth.total
                                ? t.accentGreen
                                : "#ea580c"
                            }
                            strokeWidth="4"
                            strokeLinecap="round"
                            strokeDasharray={`${
                              (componentHealth.operational /
                                componentHealth.total) *
                              113.1
                            } 113.1`}
                            transform="rotate(-90 22 22)"
                            style={{ transition: "stroke-dasharray 0.5s ease" }}
                          />
                        </svg>
                        <div
                          style={{
                            position: "absolute",
                            inset: 0,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 11,
                            fontWeight: 700,
                            color: t.text,
                            fontFamily: "var(--font-mono)",
                          }}
                        >
                          {Math.round(
                            (componentHealth.operational /
                              componentHealth.total) *
                              100
                          )}
                          %
                        </div>
                      </div>
                      <div>
                        <div
                          style={{
                            fontSize: 14,
                            fontWeight: 600,
                            color: t.text,
                            marginBottom: 3,
                          }}
                        >
                          {componentHealth.operational ===
                          componentHealth.total
                            ? "All systems operational"
                            : `${componentHealth.total - componentHealth.operational} of ${componentHealth.total} components affected`}
                        </div>
                        <div
                          style={{
                            fontSize: 12,
                            color: t.textMuted,
                          }}
                        >
                          {componentHealth.operational} of{" "}
                          {componentHealth.total} components operational
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Affected components — always shown first */}
                  {affectedComponents.length > 0 && (
                    <div style={{ marginBottom: 12 }}>
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: t.textMuted,
                          fontFamily: "var(--font-mono)",
                          textTransform: "uppercase",
                          letterSpacing: 1.5,
                          marginBottom: 8,
                          paddingLeft: 2,
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        Affected
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            color: "#fff",
                            background: "#ef4444",
                            padding: "1px 7px",
                            borderRadius: 10,
                            fontFamily: "var(--font-mono)",
                            minWidth: 18,
                            textAlign: "center",
                          }}
                        >
                          {affectedComponents.length}
                        </span>
                      </div>
                      <div
                        style={{
                          background: t.surface,
                          borderRadius: 10,
                          border: `1px solid ${t.border}`,
                          overflow: "hidden",
                        }}
                      >
                        {affectedComponents.map((c, i) => {
                          const cc =
                            STATUS_DISPLAY[c.status] ||
                            STATUS_DISPLAY.OPERATIONAL;
                          return (
                            <div
                              key={`affected-${i}`}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                padding: "14px 22px",
                                borderBottom:
                                  i < affectedComponents.length - 1
                                    ? `1px solid ${t.borderSubtle}`
                                    : "none",
                                gap: 12,
                                background: cc.color + "06",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 12,
                                  flex: 1,
                                  minWidth: 0,
                                }}
                              >
                                <div
                                  style={{
                                    width: 28,
                                    height: 28,
                                    borderRadius: 7,
                                    background: cc.color + "14",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    flexShrink: 0,
                                  }}
                                >
                                  <svg
                                    width="13"
                                    height="13"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke={cc.color}
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="12" y1="8" x2="12" y2="12" />
                                    <line x1="12" y1="16" x2="12.01" y2="16" />
                                  </svg>
                                </div>
                                <span
                                  style={{
                                    fontSize: 13,
                                    fontWeight: 600,
                                    color: t.text,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {c.name}
                                </span>
                              </div>
                              <span
                                style={{
                                  fontSize: 11,
                                  fontWeight: 600,
                                  color: cc.color,
                                  background: cc.color + "18",
                                  padding: "4px 12px",
                                  borderRadius: 6,
                                  fontFamily: "var(--font-mono)",
                                  whiteSpace: "nowrap",
                                  flexShrink: 0,
                                }}
                              >
                                {cc.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Operational components */}
                  {operationalComponents.length > 0 && (
                    <div
                      style={{
                        background: t.surface,
                        borderRadius: 10,
                        border: `1px solid ${t.border}`,
                        overflow: "hidden",
                      }}
                    >
                      {/* Summary row — always visible, clickable when there are affected */}
                      <button
                        onClick={
                          affectedComponents.length > 0
                            ? () => setShowAllOperational(!showAllOperational)
                            : undefined
                        }
                        style={{
                          width: "100%",
                          background: "none",
                          border: "none",
                          cursor:
                            affectedComponents.length > 0
                              ? "pointer"
                              : "default",
                          padding: "14px 22px",
                          display: "flex",
                          alignItems: "center",
                          gap: 14,
                          borderBottom:
                            showAllOperational || affectedComponents.length === 0
                              ? `1px solid ${t.borderSubtle}`
                              : "none",
                        }}
                      >
                        <div
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 7,
                            background: t.accentGreen + "12",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke={t.accentGreen}
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </div>
                        <div
                          style={{
                            flex: 1,
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          <span
                            style={{
                              fontSize: 13,
                              fontWeight: 600,
                              color: t.text,
                            }}
                          >
                            {operationalComponents.length} Operational
                          </span>
                          {/* Dot cluster — shows a row of green dots as a visual hint */}
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 3,
                              marginLeft: 2,
                            }}
                          >
                            {Array.from({
                              length: Math.min(operationalComponents.length, 12),
                            }).map((_, i) => (
                              <span
                                key={i}
                                style={{
                                  width: 5,
                                  height: 5,
                                  borderRadius: "50%",
                                  background: t.accentGreen,
                                  opacity: 0.5 - i * 0.03,
                                }}
                              />
                            ))}
                            {operationalComponents.length > 12 && (
                              <span
                                style={{
                                  fontSize: 10,
                                  color: t.textFaint,
                                  fontFamily: "var(--font-mono)",
                                  marginLeft: 2,
                                }}
                              >
                                +{operationalComponents.length - 12}
                              </span>
                            )}
                          </div>
                        </div>
                        {affectedComponents.length > 0 && (
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 5,
                              color: t.textMuted,
                              fontSize: 12,
                              fontWeight: 500,
                              flexShrink: 0,
                            }}
                          >
                            <span>{showAllOperational ? "Hide" : "Show"}</span>
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              style={{
                                transform: showAllOperational
                                  ? "rotate(180deg)"
                                  : "rotate(0deg)",
                                transition: "transform 0.2s ease",
                              }}
                            >
                              <polyline points="6 9 12 15 18 9" />
                            </svg>
                          </div>
                        )}
                      </button>

                      {/* Expanded component rows */}
                      {(showAllOperational || affectedComponents.length === 0) &&
                        operationalComponents.map((c, i) => (
                          <div
                            key={`op-${i}`}
                            className={
                              affectedComponents.length > 0
                                ? "animate-fade-in"
                                : undefined
                            }
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              padding: "12px 22px",
                              borderBottom:
                                i < operationalComponents.length - 1
                                  ? `1px solid ${t.borderSubtle}`
                                  : "none",
                              gap: 12,
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 12,
                                flex: 1,
                                minWidth: 0,
                              }}
                            >
                              <div
                                style={{
                                  width: 22,
                                  height: 22,
                                  borderRadius: 6,
                                  background: t.accentGreen + "10",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  flexShrink: 0,
                                }}
                              >
                                <svg
                                  width="11"
                                  height="11"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke={t.accentGreen}
                                  strokeWidth="2.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              </div>
                              <span
                                style={{
                                  fontSize: 13,
                                  fontWeight: 500,
                                  color: t.textSecondary,
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {c.name}
                              </span>
                            </div>
                            <span
                              style={{
                                fontSize: 11,
                                fontWeight: 600,
                                color: t.accentGreen,
                                fontFamily: "var(--font-mono)",
                                whiteSpace: "nowrap",
                                flexShrink: 0,
                                opacity: 0.7,
                              }}
                            >
                              Operational
                            </span>
                          </div>
                        ))}
                    </div>
                  )}
                </>
              ) : (
                <div
                  style={{
                    background: t.surface,
                    borderRadius: 10,
                    border: `1px solid ${t.border}`,
                    padding: "48px 24px",
                    textAlign: "center",
                  }}
                >
                  <svg
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={t.textFaint}
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ margin: "0 auto 12px", display: "block" }}
                  >
                    <rect x="3" y="3" width="7" height="7" />
                    <rect x="14" y="3" width="7" height="7" />
                    <rect x="3" y="14" width="7" height="7" />
                    <rect x="14" y="14" width="7" height="7" />
                  </svg>
                  <p
                    style={{
                      fontSize: 14,
                      fontWeight: 500,
                      color: t.textSecondary,
                      margin: 0,
                    }}
                  >
                    No component data available
                  </p>
                  <p
                    style={{
                      fontSize: 12,
                      color: t.textMuted,
                      margin: "6px 0 0",
                    }}
                  >
                    This service doesn&apos;t expose individual component status
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Incidents tab */}
          {activeTab === "incidents" && (
            <div className="animate-fade-in">
              {/* Active incidents */}
              {trulyActiveIncidents.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: t.textMuted,
                      fontFamily: "var(--font-mono)",
                      textTransform: "uppercase",
                      letterSpacing: 1.5,
                      marginBottom: 10,
                      paddingLeft: 2,
                    }}
                  >
                    Active Incidents
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 10,
                    }}
                  >
                    {trulyActiveIncidents.map((inc) => {
                      const ic =
                        IMPACT_DISPLAY[inc.impact] || IMPACT_DISPLAY.NONE;
                      const isExpanded = expandedIncidents.has(inc.id);
                      return (
                        <div
                          key={inc.id}
                          style={{
                            background: t.surface,
                            borderRadius: 10,
                            border: `1px solid ${ic.color}20`,
                            overflow: "hidden",
                          }}
                        >
                          {/* Incident header */}
                          <button
                            onClick={() => toggleIncident(inc.id)}
                            style={{
                              width: "100%",
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              padding: "18px 22px",
                              display: "flex",
                              alignItems: "flex-start",
                              gap: 14,
                              textAlign: "left",
                            }}
                          >
                            {/* Impact indicator */}
                            <div
                              style={{
                                width: 36,
                                height: 36,
                                borderRadius: 9,
                                background: ic.color + "14",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                                marginTop: 1,
                              }}
                            >
                              <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke={ic.color}
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2" />
                                <line x1="12" y1="8" x2="12" y2="12" />
                                <line x1="12" y1="16" x2="12.01" y2="16" />
                              </svg>
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div
                                style={{
                                  fontSize: 14,
                                  fontWeight: 600,
                                  color: t.text,
                                  marginBottom: 6,
                                  lineHeight: 1.4,
                                }}
                              >
                                {inc.title}
                              </div>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 8,
                                  flexWrap: "wrap",
                                }}
                              >
                                <span
                                  style={{
                                    fontSize: 10,
                                    fontWeight: 700,
                                    color: ic.color,
                                    background: ic.color + "18",
                                    padding: "2px 8px",
                                    borderRadius: 5,
                                    fontFamily: "var(--font-mono)",
                                    textTransform: "uppercase",
                                    letterSpacing: 0.5,
                                  }}
                                >
                                  {ic.label} Impact
                                </span>
                                <span
                                  style={{
                                    fontSize: 10,
                                    fontWeight: 600,
                                    color: t.tagText,
                                    background: t.tagBg,
                                    padding: "2px 8px",
                                    borderRadius: 5,
                                    fontFamily: "var(--font-mono)",
                                    textTransform: "uppercase",
                                    letterSpacing: 0.5,
                                  }}
                                >
                                  {inc.status}
                                </span>
                                <span
                                  style={{
                                    fontSize: 11,
                                    color: t.textFaint,
                                    fontFamily: "var(--font-mono)",
                                  }}
                                  title={formatAbsoluteDate(inc.startedAt)}
                                >
                                  Started {formatTime(inc.startedAt)}
                                </span>
                                <span
                                  style={{
                                    fontSize: 10,
                                    fontWeight: 600,
                                    color: "#ef4444",
                                    background: "#ef444412",
                                    padding: "2px 8px",
                                    borderRadius: 5,
                                    fontFamily: "var(--font-mono)",
                                  }}
                                >
                                  Ongoing {formatDuration(inc.startedAt)}
                                </span>
                              </div>
                            </div>
                            {/* Expand chevron */}
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke={t.textFaint}
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              style={{
                                flexShrink: 0,
                                marginTop: 4,
                                transform: isExpanded
                                  ? "rotate(180deg)"
                                  : "rotate(0deg)",
                                transition: "transform 0.2s ease",
                              }}
                            >
                              <polyline points="6 9 12 15 18 9" />
                            </svg>
                          </button>

                          {/* Timeline updates */}
                          {isExpanded && inc.updates.length > 0 && (
                            <div
                              style={{
                                padding: "0 22px 20px",
                                borderTop: `1px solid ${t.divider}`,
                              }}
                            >
                              <div style={{ paddingTop: 16 }}>
                                {inc.updates.map((u, ui) => {
                                  const iconType =
                                    INCIDENT_STATUS_ICON[u.status] || "search";
                                  const isLast =
                                    ui === inc.updates.length - 1;
                                  return (
                                    <div
                                      key={u.id}
                                      style={{
                                        display: "flex",
                                        gap: 14,
                                        position: "relative",
                                      }}
                                    >
                                      {/* Timeline connector */}
                                      <div
                                        style={{
                                          display: "flex",
                                          flexDirection: "column",
                                          alignItems: "center",
                                          width: 24,
                                          flexShrink: 0,
                                        }}
                                      >
                                        <div
                                          style={{
                                            width: 24,
                                            height: 24,
                                            borderRadius: "50%",
                                            background: t.tagBg,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            flexShrink: 0,
                                            zIndex: 1,
                                          }}
                                        >
                                          <StatusIcon
                                            type={iconType}
                                            color={t.textMuted}
                                            size={12}
                                          />
                                        </div>
                                        {!isLast && (
                                          <div
                                            style={{
                                              width: 1.5,
                                              flex: 1,
                                              background: t.borderSubtle,
                                              minHeight: 16,
                                            }}
                                          />
                                        )}
                                      </div>
                                      {/* Update content */}
                                      <div
                                        style={{
                                          flex: 1,
                                          paddingBottom: isLast ? 0 : 20,
                                          minWidth: 0,
                                        }}
                                      >
                                        <div
                                          style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 8,
                                            marginBottom: 5,
                                            flexWrap: "wrap",
                                          }}
                                        >
                                          <span
                                            style={{
                                              fontSize: 12,
                                              fontWeight: 600,
                                              color: t.textSecondary,
                                            }}
                                          >
                                            {u.status.charAt(0) +
                                              u.status.slice(1).toLowerCase()}
                                          </span>
                                          <span
                                            style={{
                                              fontSize: 11,
                                              color: t.textFaint,
                                              fontFamily: "var(--font-mono)",
                                            }}
                                          >
                                            {formatFullDate(u.createdAt)}
                                          </span>
                                        </div>
                                        <p
                                          style={{
                                            margin: 0,
                                            fontSize: 13,
                                            color: t.textMuted,
                                            lineHeight: 1.65,
                                            wordBreak: "break-word",
                                          }}
                                        >
                                          {u.body}
                                        </p>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>

                              {/* Source link */}
                              {inc.sourceUrl && (
                                <a
                                  href={inc.sourceUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 5,
                                    fontSize: 11,
                                    color: t.accentPrimary,
                                    fontFamily: "var(--font-mono)",
                                    textDecoration: "none",
                                    marginTop: 14,
                                    paddingLeft: 38,
                                    transition: "opacity 0.15s",
                                  }}
                                  onMouseEnter={(e) =>
                                    (e.currentTarget.style.opacity = "0.7")
                                  }
                                  onMouseLeave={(e) =>
                                    (e.currentTarget.style.opacity = "1")
                                  }
                                >
                                  <svg
                                    width="11"
                                    height="11"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                    <polyline points="15 3 21 3 21 9" />
                                    <line x1="10" y1="14" x2="21" y2="3" />
                                  </svg>
                                  View on status page
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Fix Deployed — Monitoring section */}
              {monitoringIncidents.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: MONITORING_DISPLAY.color,
                      fontFamily: "var(--font-mono)",
                      textTransform: "uppercase",
                      letterSpacing: 1.5,
                      marginBottom: 10,
                      paddingLeft: 2,
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke={MONITORING_DISPLAY.color}
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                    {MONITORING_DISPLAY.label}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 10,
                    }}
                  >
                    {monitoringIncidents.map((inc) => {
                      const ic =
                        IMPACT_DISPLAY[inc.impact] || IMPACT_DISPLAY.NONE;
                      const isExpanded = expandedIncidents.has(inc.id);
                      return (
                        <div
                          key={inc.id}
                          style={{
                            background: t.surface,
                            borderRadius: 10,
                            border: `1px solid ${MONITORING_DISPLAY.color}20`,
                            overflow: "hidden",
                          }}
                        >
                          {/* Incident header */}
                          <button
                            onClick={() => toggleIncident(inc.id)}
                            style={{
                              width: "100%",
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              padding: "18px 22px",
                              display: "flex",
                              alignItems: "flex-start",
                              gap: 14,
                              textAlign: "left",
                            }}
                          >
                            {/* Monitoring eye icon */}
                            <div
                              style={{
                                width: 36,
                                height: 36,
                                borderRadius: 9,
                                background: MONITORING_DISPLAY.color + "14",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                                marginTop: 1,
                              }}
                            >
                              <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke={MONITORING_DISPLAY.color}
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                <circle cx="12" cy="12" r="3" />
                              </svg>
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div
                                style={{
                                  fontSize: 14,
                                  fontWeight: 600,
                                  color: t.text,
                                  marginBottom: 6,
                                  lineHeight: 1.4,
                                }}
                              >
                                {inc.title}
                              </div>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 8,
                                  flexWrap: "wrap",
                                }}
                              >
                                <span
                                  style={{
                                    fontSize: 10,
                                    fontWeight: 700,
                                    color: MONITORING_DISPLAY.color,
                                    background: MONITORING_DISPLAY.color + "18",
                                    padding: "2px 8px",
                                    borderRadius: 5,
                                    fontFamily: "var(--font-mono)",
                                    textTransform: "uppercase",
                                    letterSpacing: 0.5,
                                  }}
                                >
                                  Monitoring
                                </span>
                                <span
                                  style={{
                                    fontSize: 10,
                                    fontWeight: 600,
                                    color: ic.color,
                                    background: ic.color + "18",
                                    padding: "2px 8px",
                                    borderRadius: 5,
                                    fontFamily: "var(--font-mono)",
                                    textTransform: "uppercase",
                                    letterSpacing: 0.5,
                                    opacity: 0.7,
                                  }}
                                >
                                  {ic.label} Impact
                                </span>
                                <span
                                  style={{
                                    fontSize: 11,
                                    color: t.textFaint,
                                    fontFamily: "var(--font-mono)",
                                  }}
                                  title={formatAbsoluteDate(inc.startedAt)}
                                >
                                  Started {formatTime(inc.startedAt)}
                                </span>
                                <span
                                  style={{
                                    fontSize: 10,
                                    fontWeight: 600,
                                    color: MONITORING_DISPLAY.color,
                                    background: MONITORING_DISPLAY.color + "12",
                                    padding: "2px 8px",
                                    borderRadius: 5,
                                    fontFamily: "var(--font-mono)",
                                  }}
                                >
                                  Watching {formatDuration(inc.startedAt)}
                                </span>
                              </div>
                            </div>
                            {/* Expand chevron */}
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke={t.textFaint}
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              style={{
                                flexShrink: 0,
                                marginTop: 4,
                                transform: isExpanded
                                  ? "rotate(180deg)"
                                  : "rotate(0deg)",
                                transition: "transform 0.2s ease",
                              }}
                            >
                              <polyline points="6 9 12 15 18 9" />
                            </svg>
                          </button>

                          {/* Timeline updates */}
                          {isExpanded && inc.updates.length > 0 && (
                            <div
                              style={{
                                padding: "0 22px 20px",
                                borderTop: `1px solid ${t.divider}`,
                              }}
                            >
                              <div style={{ paddingTop: 16 }}>
                                {inc.updates.map((u, ui) => {
                                  const iconType =
                                    INCIDENT_STATUS_ICON[u.status] || "search";
                                  const isLast =
                                    ui === inc.updates.length - 1;
                                  return (
                                    <div
                                      key={u.id}
                                      style={{
                                        display: "flex",
                                        gap: 14,
                                        position: "relative",
                                      }}
                                    >
                                      <div
                                        style={{
                                          display: "flex",
                                          flexDirection: "column",
                                          alignItems: "center",
                                          width: 24,
                                          flexShrink: 0,
                                        }}
                                      >
                                        <div
                                          style={{
                                            width: 24,
                                            height: 24,
                                            borderRadius: "50%",
                                            background: t.tagBg,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            flexShrink: 0,
                                            zIndex: 1,
                                          }}
                                        >
                                          <StatusIcon
                                            type={iconType}
                                            color={t.textMuted}
                                            size={12}
                                          />
                                        </div>
                                        {!isLast && (
                                          <div
                                            style={{
                                              width: 1.5,
                                              flex: 1,
                                              background: t.borderSubtle,
                                              minHeight: 16,
                                            }}
                                          />
                                        )}
                                      </div>
                                      <div
                                        style={{
                                          flex: 1,
                                          paddingBottom: isLast ? 0 : 20,
                                          minWidth: 0,
                                        }}
                                      >
                                        <div
                                          style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 8,
                                            marginBottom: 5,
                                            flexWrap: "wrap",
                                          }}
                                        >
                                          <span
                                            style={{
                                              fontSize: 12,
                                              fontWeight: 600,
                                              color: t.textSecondary,
                                            }}
                                          >
                                            {u.status.charAt(0) +
                                              u.status.slice(1).toLowerCase()}
                                          </span>
                                          <span
                                            style={{
                                              fontSize: 11,
                                              color: t.textFaint,
                                              fontFamily: "var(--font-mono)",
                                            }}
                                          >
                                            {formatFullDate(u.createdAt)}
                                          </span>
                                        </div>
                                        <p
                                          style={{
                                            margin: 0,
                                            fontSize: 13,
                                            color: t.textMuted,
                                            lineHeight: 1.65,
                                            wordBreak: "break-word",
                                          }}
                                        >
                                          {u.body}
                                        </p>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>

                              {/* Source link */}
                              {inc.sourceUrl && (
                                <a
                                  href={inc.sourceUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 5,
                                    fontSize: 11,
                                    color: MONITORING_DISPLAY.color,
                                    fontFamily: "var(--font-mono)",
                                    textDecoration: "none",
                                    marginTop: 14,
                                    paddingLeft: 38,
                                    transition: "opacity 0.15s",
                                  }}
                                  onMouseEnter={(e) =>
                                    (e.currentTarget.style.opacity = "0.7")
                                  }
                                  onMouseLeave={(e) =>
                                    (e.currentTarget.style.opacity = "1")
                                  }
                                >
                                  <svg
                                    width="11"
                                    height="11"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                    <polyline points="15 3 21 3 21 9" />
                                    <line x1="10" y1="14" x2="21" y2="3" />
                                  </svg>
                                  View on status page
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Resolved incidents */}
              {resolvedIncidents.length > 0 && (
                <div>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: t.textMuted,
                      fontFamily: "var(--font-mono)",
                      textTransform: "uppercase",
                      letterSpacing: 1.5,
                      marginBottom: 10,
                      paddingLeft: 2,
                    }}
                  >
                    Recent Resolved
                  </div>
                  <div
                    style={{
                      background: t.surface,
                      borderRadius: 10,
                      border: `1px solid ${t.border}`,
                      overflow: "hidden",
                    }}
                  >
                    {resolvedIncidents.map((inc, i) => {
                      const ic =
                        IMPACT_DISPLAY[inc.impact] || IMPACT_DISPLAY.NONE;
                      const isExpanded = expandedIncidents.has(inc.id);
                      return (
                        <div
                          key={inc.id}
                          style={{
                            borderBottom:
                              i < resolvedIncidents.length - 1
                                ? `1px solid ${t.divider}`
                                : "none",
                          }}
                        >
                          <button
                            onClick={() => toggleIncident(inc.id)}
                            style={{
                              width: "100%",
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              padding: "16px 22px",
                              display: "flex",
                              alignItems: "center",
                              gap: 12,
                              textAlign: "left",
                            }}
                          >
                            {/* Resolved check icon */}
                            <div
                              style={{
                                width: 28,
                                height: 28,
                                borderRadius: 7,
                                background: t.accentGreen + "10",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                              }}
                            >
                              <svg
                                width="13"
                                height="13"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke={t.accentGreen}
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            </div>
                            <div
                              style={{
                                flex: 1,
                                minWidth: 0,
                              }}
                            >
                              <div
                                style={{
                                  fontSize: 13,
                                  fontWeight: 500,
                                  color: t.textSecondary,
                                  marginBottom: 3,
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {inc.title}
                              </div>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 8,
                                }}
                              >
                                <span
                                  style={{
                                    fontSize: 10,
                                    fontWeight: 600,
                                    color: ic.color,
                                    fontFamily: "var(--font-mono)",
                                    textTransform: "uppercase",
                                    letterSpacing: 0.5,
                                    opacity: 0.7,
                                  }}
                                >
                                  {ic.label}
                                </span>
                                <span
                                  style={{
                                    fontSize: 11,
                                    color: t.textFaint,
                                    fontFamily: "var(--font-mono)",
                                  }}
                                  title={formatAbsoluteDate(inc.resolvedAt!)}
                                >
                                  Resolved {formatTime(inc.resolvedAt!)}
                                </span>
                              </div>
                            </div>
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke={t.textFaint}
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              style={{
                                flexShrink: 0,
                                transform: isExpanded
                                  ? "rotate(180deg)"
                                  : "rotate(0deg)",
                                transition: "transform 0.2s ease",
                              }}
                            >
                              <polyline points="6 9 12 15 18 9" />
                            </svg>
                          </button>

                          {/* Expanded timeline */}
                          {isExpanded && inc.updates.length > 0 && (
                            <div
                              style={{
                                padding: "0 22px 18px",
                                borderTop: `1px solid ${t.divider}`,
                              }}
                            >
                              <div style={{ paddingTop: 14 }}>
                                {inc.updates.map((u, ui) => {
                                  const iconType =
                                    INCIDENT_STATUS_ICON[u.status] || "search";
                                  const isLast =
                                    ui === inc.updates.length - 1;
                                  return (
                                    <div
                                      key={u.id}
                                      style={{
                                        display: "flex",
                                        gap: 14,
                                        position: "relative",
                                      }}
                                    >
                                      <div
                                        style={{
                                          display: "flex",
                                          flexDirection: "column",
                                          alignItems: "center",
                                          width: 24,
                                          flexShrink: 0,
                                        }}
                                      >
                                        <div
                                          style={{
                                            width: 24,
                                            height: 24,
                                            borderRadius: "50%",
                                            background: t.tagBg,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            flexShrink: 0,
                                            zIndex: 1,
                                          }}
                                        >
                                          <StatusIcon
                                            type={iconType}
                                            color={t.textMuted}
                                            size={12}
                                          />
                                        </div>
                                        {!isLast && (
                                          <div
                                            style={{
                                              width: 1.5,
                                              flex: 1,
                                              background: t.borderSubtle,
                                              minHeight: 16,
                                            }}
                                          />
                                        )}
                                      </div>
                                      <div
                                        style={{
                                          flex: 1,
                                          paddingBottom: isLast ? 0 : 18,
                                          minWidth: 0,
                                        }}
                                      >
                                        <div
                                          style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 8,
                                            marginBottom: 4,
                                            flexWrap: "wrap",
                                          }}
                                        >
                                          <span
                                            style={{
                                              fontSize: 12,
                                              fontWeight: 600,
                                              color: t.textSecondary,
                                            }}
                                          >
                                            {u.status.charAt(0) +
                                              u.status.slice(1).toLowerCase()}
                                          </span>
                                          <span
                                            style={{
                                              fontSize: 11,
                                              color: t.textFaint,
                                              fontFamily: "var(--font-mono)",
                                            }}
                                          >
                                            {formatFullDate(u.createdAt)}
                                          </span>
                                        </div>
                                        <p
                                          style={{
                                            margin: 0,
                                            fontSize: 13,
                                            color: t.textMuted,
                                            lineHeight: 1.65,
                                            wordBreak: "break-word",
                                          }}
                                        >
                                          {u.body}
                                        </p>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* No incidents at all */}
              {trulyActiveIncidents.length === 0 &&
                monitoringIncidents.length === 0 &&
                resolvedIncidents.length === 0 && (
                  <div
                    style={{
                      background: t.surface,
                      borderRadius: 10,
                      border: `1px solid ${t.border}`,
                      padding: "48px 24px",
                      textAlign: "center",
                    }}
                  >
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 10,
                        background: t.accentGreen + "10",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        margin: "0 auto 14px",
                      }}
                    >
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke={t.accentGreen}
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                        <polyline points="22 4 12 14.01 9 11.01" />
                      </svg>
                    </div>
                    <p
                      style={{
                        fontSize: 15,
                        fontWeight: 600,
                        color: t.text,
                        margin: 0,
                      }}
                    >
                      No incidents reported
                    </p>
                    <p
                      style={{
                        fontSize: 13,
                        color: t.textMuted,
                        margin: "6px 0 0",
                      }}
                    >
                      This service is operating normally with no recent issues
                    </p>
                  </div>
                )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
