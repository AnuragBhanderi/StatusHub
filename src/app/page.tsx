"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { THEMES, type ThemeKey, type Theme } from "@/config/themes";
import { CATEGORIES } from "@/config/services";
import { STATUS_DISPLAY, MONITORING_DISPLAY } from "@/lib/normalizer";
import { useUser } from "@/lib/user-context";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import StatusBanner from "@/components/StatusBanner";
import SearchBar from "@/components/SearchBar";
import CategoryPills from "@/components/CategoryPills";
import ServiceCard from "@/components/ServiceCard";
import MyStackToggle from "@/components/MyStackToggle";
import ServiceDetailView from "@/components/ServiceDetailView";
import UserMenu from "@/components/UserMenu";
import NotificationBell from "@/components/NotificationBell";
import AuthButton from "@/components/AuthButton";
import { usePushNotifications } from "@/lib/hooks/use-push-notifications";

interface ServiceData {
  id: string;
  name: string;
  slug: string;
  category: string;
  currentStatus: string;
  statusPageUrl: string;
  logoUrl: string | null;
  lastPolledAt: string | null;
  incidentCount: number;
  latestIncident: {
    id: string;
    title: string;
    status: string;
    impact: string;
    startedAt: string;
  } | null;
  monitoringCount: number;
  latestMonitoringIncident: {
    id: string;
    title: string;
    status: string;
    impact: string;
    startedAt: string;
  } | null;
}

export default function Home() {
  const {
    user,
    isLoading: authLoading,
    isSupabaseEnabled,
    preferences: { theme, compact, myStack },
    setTheme,
    setCompact,
    toggleStack,
    notificationPrefs,
    setPushEnabled,
  } = useUser();

  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [showMyStack, setShowMyStack] = useState(false);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState("");
  const [services, setServices] = useState<ServiceData[]>([]);
  const [hasMounted, setHasMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [sortMode, setSortMode] = useState<"status" | "name" | "category">("status");
  const searchRef = useRef<HTMLInputElement>(null);

  // Browser push notifications for My Stack services
  usePushNotifications(services, myStack, notificationPrefs.pushEnabled);

  // Keyboard shortcuts: Cmd/Ctrl+K to focus search, Esc to close detail
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === "Escape") {
        if (selectedSlug) {
          setSelectedSlug(null);
        } else if (document.activeElement === searchRef.current) {
          searchRef.current?.blur();
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedSlug]);

  // Mount guard + URL params
  useEffect(() => {
    setHasMounted(true);
    const params = new URLSearchParams(window.location.search);
    const serviceParam = params.get("service");
    if (serviceParam) {
      setSelectedSlug(serviceParam);
    }
  }, []);

  // Fetch live data from API
  const fetchServices = useCallback(async () => {
    try {
      setError(false);
      const res = await fetch("/api/services");
      if (res.ok) {
        const data = await res.json();
        if (data.services && data.services.length > 0) {
          setServices(data.services);
          setLastUpdated(new Date().toLocaleTimeString());
        } else {
          setError(true);
        }
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchServices();
    const interval = setInterval(fetchServices, 180000); // 3 min
    return () => clearInterval(interval);
  }, []);

  const t = THEMES[theme];

  const filtered = useMemo(() => {
    let list = services;
    if (showMyStack) list = list.filter((s) => myStack.includes(s.slug));
    if (activeCategory !== "All")
      list = list.filter((s) => s.category === activeCategory);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.category.toLowerCase().includes(q)
      );
    }
    const sorter = (a: ServiceData, b: ServiceData) => {
      if (sortMode === "name") return a.name.localeCompare(b.name);
      if (sortMode === "category") {
        const cat = a.category.localeCompare(b.category);
        if (cat !== 0) return cat;
        return a.name.localeCompare(b.name);
      }
      const orderA = STATUS_DISPLAY[a.currentStatus]?.order ?? 5;
      const orderB = STATUS_DISPLAY[b.currentStatus]?.order ?? 5;
      return orderA - orderB;
    };
    return {
      issues: list.filter((s) => s.currentStatus !== "OPERATIONAL").sort(sorter),
      monitoring: list.filter((s) => s.currentStatus === "OPERATIONAL" && s.monitoringCount > 0).sort(sorter),
      operational: list.filter((s) => s.currentStatus === "OPERATIONAL" && s.monitoringCount === 0).sort(sorter),
      total: list.length,
    };
  }, [search, activeCategory, showMyStack, myStack, services, sortMode]);

  const operational = services.filter(
    (s) => s.currentStatus === "OPERATIONAL"
  ).length;
  const issues = services.length - operational;
  const servicesWithIssues = services.filter(
    (s) => s.currentStatus !== "OPERATIONAL"
  );
  const monitoringOnlyCount = services.filter(
    (s) => s.currentStatus === "OPERATIONAL" && s.monitoringCount > 0
  ).length;

  const selectedService = selectedSlug
    ? services.find((s) => s.slug === selectedSlug) || null
    : null;

  // Prevent flash of wrong theme — use transparent to avoid showing wrong color
  if (!hasMounted) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "transparent",
        }}
      />
    );
  }

  // Show landing page for unauthenticated users when Supabase is configured
  if (isSupabaseEnabled && !user && !authLoading) {
    return <LandingPage t={t} />;
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
      {/* Header */}
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
            <div
              className="animate-glow"
              style={{
                width: 32,
                height: 32,
                borderRadius: 9,
                background: `linear-gradient(135deg, ${t.accentPrimary} 0%, ${t.accentGreen} 100%)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontSize: 15,
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
                fontSize: 19,
                color: t.text,
                letterSpacing: -0.5,
              }}
            >
              StatusHub
            </span>
            <span
              className="sh-header-beta"
              style={{
                fontSize: 9,
                fontWeight: 700,
                color: t.betaText,
                background: t.betaBg,
                padding: "3px 8px",
                borderRadius: 5,
                fontFamily: "var(--font-mono)",
                letterSpacing: 1.5,
                flexShrink: 0,
              }}
            >
              BETA
            </span>
          </div>
          <div
            className="sh-header-right"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <ThemeSwitcher theme={theme} setTheme={setTheme} t={t} />
            {isSupabaseEnabled && user && (
              <NotificationBell
                pushEnabled={notificationPrefs.pushEnabled}
                onToggle={() => setPushEnabled(!notificationPrefs.pushEnabled)}
                t={t}
              />
            )}
            {isSupabaseEnabled && user && <UserMenu t={t} />}
            {!loading && (
              <>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: t.accentGreen,
                      boxShadow: `0 0 8px ${t.accentGreen}80`,
                      flexShrink: 0,
                    }}
                  />
                  <span
                    className="sh-live-text"
                    style={{
                      fontSize: 11,
                      color: t.textMuted,
                      fontFamily: "var(--font-mono)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Live {lastUpdated ? `· ${lastUpdated}` : ""}
                  </span>
                </div>
                <MyStackToggle
                  showMyStack={showMyStack}
                  onToggle={() => setShowMyStack(!showMyStack)}
                  count={myStack.length}
                  t={t}
                />
              </>
            )}
          </div>
        </div>
      </header>

      <main
        className="sh-main"
        style={{
          maxWidth: 1120,
          margin: "0 auto",
          padding: "28px 24px 80px",
        }}
      >
        {/* Loading State */}
        {loading ? (
          <div
            className="animate-fade-in"
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "120px 24px",
            }}
          >
            {/* Spinner */}
            <div
              style={{
                position: "relative",
                width: 48,
                height: 48,
                marginBottom: 28,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: "50%",
                  border: `2.5px solid ${t.border}`,
                }}
              />
              <div
                className="animate-spin-slow"
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: "50%",
                  border: "2.5px solid transparent",
                  borderTopColor: t.accentPrimary,
                  borderRightColor: t.accentPrimary,
                  animation: "spin-slow 1s linear infinite",
                }}
              />
            </div>

            <div
              style={{
                fontSize: 17,
                fontWeight: 600,
                color: t.text,
                fontFamily: "var(--font-sans)",
                marginBottom: 8,
              }}
            >
              Fetching live status data
            </div>
            <div
              style={{
                fontSize: 13,
                color: t.textMuted,
                fontFamily: "var(--font-sans)",
                textAlign: "center",
                maxWidth: 360,
                lineHeight: 1.5,
              }}
            >
              Checking {CATEGORIES.length} categories across 40+ services via
              official APIs...
            </div>

            {/* Skeleton cards */}
            <div
              style={{
                width: "100%",
                maxWidth: 900,
                marginTop: 48,
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fill, minmax(260px, 1fr))",
                gap: 10,
              }}
            >
              {Array.from({ length: 9 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    background: t.surface,
                    borderRadius: 14,
                    padding: "16px 18px",
                    border: `1px solid ${t.border}`,
                    opacity: 0.5 - i * 0.04,
                    animation: `fade-in 0.4s ease ${i * 0.06}s both`,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 9,
                        background: t.logoBg,
                        border: `1px solid ${t.logoBorder}`,
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          height: 12,
                          width: 80 + ((i * 17) % 40),
                          borderRadius: 6,
                          background: t.logoBg,
                          marginBottom: 8,
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
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : error && services.length === 0 ? (
          <div
            className="animate-fade-in"
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "120px 24px",
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                background: "rgba(239,68,68,0.10)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 20,
              }}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#ef4444"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <div
              style={{
                fontSize: 17,
                fontWeight: 600,
                color: t.text,
                marginBottom: 8,
              }}
            >
              Unable to fetch status data
            </div>
            <div
              style={{
                fontSize: 13,
                color: t.textMuted,
                textAlign: "center",
                maxWidth: 360,
                lineHeight: 1.5,
                marginBottom: 24,
              }}
            >
              Could not connect to the status APIs. This may be a network issue
              or the services may be temporarily unavailable.
            </div>
            <button
              onClick={() => {
                setLoading(true);
                setError(false);
                fetchServices();
              }}
              style={{
                background: t.accentPrimary,
                color: "#fff",
                border: "none",
                borderRadius: 10,
                padding: "10px 24px",
                fontSize: 13,
                fontWeight: 600,
                fontFamily: "var(--font-sans)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 7,
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
                <polyline points="23 4 23 10 17 10" />
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
              </svg>
              Retry
            </button>
          </div>
        ) : selectedService ? (
          <ServiceDetailView
            service={selectedService}
            onBack={() => setSelectedSlug(null)}
            isInStack={myStack.includes(selectedService.slug)}
            onToggleStack={() => toggleStack(selectedService.slug)}
            t={t}
          />
        ) : (
          <>
            <StatusBanner
              total={services.length}
              operational={operational}
              issues={issues}
              servicesWithIssues={servicesWithIssues}
              onSelectService={setSelectedSlug}
              monitoringOnlyCount={monitoringOnlyCount}
              t={t}
            />

            <SearchBar ref={searchRef} value={search} onChange={setSearch} t={t} />

            {/* Sort + Compact toolbar */}
            <div
              className="sh-toolbar"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 12,
                gap: 8,
              }}
            >
              {/* Sort toggle */}
              <div
                className="sh-toolbar-sort"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  background: t.tagBg,
                  borderRadius: 10,
                  border: `1px solid ${t.border}`,
                  padding: 3,
                }}
              >
                {(["status", "name", "category"] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setSortMode(mode)}
                    style={{
                      background: sortMode === mode ? t.pillActiveBg : "transparent",
                      border: sortMode === mode ? `1px solid ${t.pillActiveBorder}` : "1px solid transparent",
                      borderRadius: 7,
                      padding: "5px 14px",
                      fontSize: 11,
                      fontWeight: 600,
                      fontFamily: "var(--font-mono)",
                      color: sortMode === mode ? t.pillActiveText : t.textMuted,
                      cursor: "pointer",
                      transition: "all 0.15s",
                      textTransform: "capitalize",
                    }}
                  >
                    {mode}
                  </button>
                ))}
              </div>

              {/* Compact toggle */}
              <button
                onClick={() => setCompact(!compact)}
                title={compact ? "Switch to comfortable view" : "Switch to compact view"}
                style={{
                  background: compact ? t.pillActiveBg : t.tagBg,
                  border: `1px solid ${compact ? t.pillActiveBorder : t.border}`,
                  borderRadius: 10,
                  padding: "6px 14px",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  cursor: "pointer",
                  transition: "all 0.15s",
                  color: compact ? t.pillActiveText : t.textMuted,
                  fontSize: 11,
                  fontWeight: 600,
                  fontFamily: "var(--font-mono)",
                  flexShrink: 0,
                }}
              >
                {compact ? (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
                    <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
                  </svg>
                ) : (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                    <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
                  </svg>
                )}
                {compact ? "Compact" : "Comfy"}
              </button>
            </div>

            <CategoryPills
              categories={CATEGORIES}
              active={activeCategory}
              onChange={setActiveCategory}
              t={t}
            />

            {filtered.total === 0 ? (
              <div style={{ textAlign: "center", padding: "80px 0" }}>
                <div
                  style={{
                    fontSize: 36,
                    marginBottom: 12,
                    opacity: t.emptyIcon,
                  }}
                >
                  <svg
                    width="36"
                    height="36"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={t.emptyText}
                    strokeWidth="1.5"
                    style={{ display: "inline" }}
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                  </svg>
                </div>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 500,
                    color: t.emptyText,
                  }}
                >
                  {showMyStack
                    ? "No services in your stack yet."
                    : "No services found."}
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: t.emptySubtext,
                    marginTop: 6,
                  }}
                >
                  {showMyStack
                    ? "Click the star on any service to add it."
                    : "Try a different search term."}
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: compact ? 16 : 24 }}>
                {/* Issues section */}
                {filtered.issues.length > 0 && (
                  <section>
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: compact ? 8 : 12,
                    }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                      <span style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: t.textSecondary,
                        fontFamily: "var(--font-mono)",
                        letterSpacing: 0.5,
                        textTransform: "uppercase",
                      }}>
                        Issues ({filtered.issues.length})
                      </span>
                    </div>
                    <div
                      className="sh-grid"
                      style={{
                        display: "grid",
                        gridTemplateColumns: compact
                          ? "repeat(auto-fill, minmax(200px, 1fr))"
                          : "repeat(auto-fill, minmax(280px, 1fr))",
                        gap: compact ? 6 : 10,
                      }}
                    >
                      {filtered.issues.map((s, i) => (
                        <div key={s.slug} className="animate-slide-up" style={{ animationDelay: `${i * 0.025}s` }}>
                          <ServiceCard
                            name={s.name} slug={s.slug} currentStatus={s.currentStatus}
                            logoUrl={s.logoUrl} latestIncident={s.latestIncident}
                            monitoringCount={s.monitoringCount}
                            latestMonitoringIncident={s.latestMonitoringIncident}
                            compact={compact} onClick={() => setSelectedSlug(s.slug)}
                            isInStack={myStack.includes(s.slug)}
                            onToggleStack={() => toggleStack(s.slug)} t={t}
                          />
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Monitoring section */}
                {filtered.monitoring.length > 0 && (
                  <section>
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: compact ? 8 : 12,
                    }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={MONITORING_DISPLAY.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                      <span style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: t.textSecondary,
                        fontFamily: "var(--font-mono)",
                        letterSpacing: 0.5,
                        textTransform: "uppercase",
                      }}>
                        Monitoring ({filtered.monitoring.length})
                      </span>
                    </div>
                    <div
                      className="sh-grid"
                      style={{
                        display: "grid",
                        gridTemplateColumns: compact
                          ? "repeat(auto-fill, minmax(200px, 1fr))"
                          : "repeat(auto-fill, minmax(280px, 1fr))",
                        gap: compact ? 6 : 10,
                      }}
                    >
                      {filtered.monitoring.map((s, i) => (
                        <div key={s.slug} className="animate-slide-up" style={{ animationDelay: `${i * 0.025}s` }}>
                          <ServiceCard
                            name={s.name} slug={s.slug} currentStatus={s.currentStatus}
                            logoUrl={s.logoUrl} latestIncident={s.latestIncident}
                            monitoringCount={s.monitoringCount}
                            latestMonitoringIncident={s.latestMonitoringIncident}
                            compact={compact} onClick={() => setSelectedSlug(s.slug)}
                            isInStack={myStack.includes(s.slug)}
                            onToggleStack={() => toggleStack(s.slug)} t={t}
                          />
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Operational section */}
                {filtered.operational.length > 0 && (
                  <section>
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: compact ? 8 : 12,
                    }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <span style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: t.textSecondary,
                        fontFamily: "var(--font-mono)",
                        letterSpacing: 0.5,
                        textTransform: "uppercase",
                      }}>
                        Operational ({filtered.operational.length})
                      </span>
                    </div>
                    <div
                      className="sh-grid"
                      style={{
                        display: "grid",
                        gridTemplateColumns: compact
                          ? "repeat(auto-fill, minmax(200px, 1fr))"
                          : "repeat(auto-fill, minmax(280px, 1fr))",
                        gap: compact ? 6 : 10,
                      }}
                    >
                      {filtered.operational.map((s, i) => (
                        <div key={s.slug} className="animate-slide-up" style={{ animationDelay: `${i * 0.025}s` }}>
                          <ServiceCard
                            name={s.name} slug={s.slug} currentStatus={s.currentStatus}
                            logoUrl={s.logoUrl} latestIncident={s.latestIncident}
                            monitoringCount={s.monitoringCount}
                            latestMonitoringIncident={s.latestMonitoringIncident}
                            compact={compact} onClick={() => setSelectedSlug(s.slug)}
                            isInStack={myStack.includes(s.slug)}
                            onToggleStack={() => toggleStack(s.slug)} t={t}
                          />
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            )}

            <div
              style={{
                textAlign: "center",
                marginTop: 52,
                fontSize: 11,
                color: t.footerColor,
                fontFamily: "var(--font-mono)",
                letterSpacing: 0.5,
              }}
            >
              {services.length} services monitored via official APIs · Refreshes
              every 3 min
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function LandingPage({ t }: { t: Theme }) {
  const { signInWithGoogle, signInWithGitHub } = useUser();

  return (
    <div
      className="theme-transition"
      style={{
        minHeight: "100vh",
        background: t.bg,
        fontFamily: "var(--font-sans)",
        color: t.text,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <header
        style={{
          background: t.headerBg,
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: `1px solid ${t.border}`,
          padding: "14px 0",
        }}
      >
        <div
          style={{
            maxWidth: 1120,
            margin: "0 auto",
            padding: "0 24px",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <div
            className="animate-glow"
            style={{
              width: 32,
              height: 32,
              borderRadius: 9,
              background: `linear-gradient(135deg, ${t.accentPrimary} 0%, ${t.accentGreen} 100%)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: 15,
              fontWeight: 700,
              fontFamily: "var(--font-mono)",
            }}
          >
            S
          </div>
          <span
            style={{
              fontWeight: 700,
              fontSize: 19,
              color: t.text,
              letterSpacing: -0.5,
            }}
          >
            StatusHub
          </span>
        </div>
      </header>

      {/* Hero */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "80px 24px",
          textAlign: "center",
          maxWidth: 640,
          margin: "0 auto",
          width: "100%",
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 16,
            background: `linear-gradient(135deg, ${t.accentPrimary}, ${t.accentGreen})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontSize: 24,
            fontWeight: 700,
            fontFamily: "var(--font-mono)",
            marginBottom: 28,
          }}
        >
          S
        </div>

        <h1
          style={{
            fontSize: 40,
            fontWeight: 700,
            letterSpacing: -1,
            lineHeight: 1.2,
            marginBottom: 16,
            margin: "0 0 16px 0",
          }}
        >
          Monitor every service.
          <br />
          <span style={{ color: t.accentPrimary }}>One dashboard.</span>
        </h1>

        <p
          style={{
            fontSize: 17,
            color: t.textMuted,
            lineHeight: 1.6,
            marginBottom: 40,
            maxWidth: 480,
          }}
        >
          Track the real-time status of 40+ services including AWS, GitHub,
          Vercel, Stripe, and more. Build your personalized stack and never miss
          an outage again.
        </p>

        {/* Feature highlights */}
        <div
          className="sh-landing-features"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 16,
            marginBottom: 48,
            width: "100%",
          }}
        >
          {[
            {
              label: "40+ Services",
              desc: "Real-time monitoring",
              icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={t.accentPrimary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
              ),
            },
            {
              label: "My Stack",
              desc: "Personalized dashboard",
              icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={t.accentPrimary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              ),
            },
            {
              label: "Cloud Sync",
              desc: "Preferences everywhere",
              icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={t.accentPrimary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z" />
                </svg>
              ),
            },
          ].map((f) => (
            <div
              key={f.label}
              style={{
                padding: "20px 16px",
                borderRadius: 14,
                background: t.surface,
                border: `1px solid ${t.border}`,
                textAlign: "center",
              }}
            >
              <div style={{ marginBottom: 10 }}>{f.icon}</div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: t.text,
                }}
              >
                {f.label}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: t.textMuted,
                  marginTop: 4,
                }}
              >
                {f.desc}
              </div>
            </div>
          ))}
        </div>

        {/* Sign-in buttons */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
            width: "100%",
            maxWidth: 320,
          }}
        >
          <AuthButton t={t} />
        </div>

        <p
          style={{
            fontSize: 11,
            color: t.footerColor,
            marginTop: 24,
            fontFamily: "var(--font-mono)",
          }}
        >
          Free and open source. Your data stays yours.
        </p>
      </div>
    </div>
  );
}
