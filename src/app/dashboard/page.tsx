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
import { ToastProvider, useToast } from "@/components/Toast";
import AppHeader from "@/components/AppHeader";
import AppFooter from "@/components/AppFooter";
import LoadingState from "@/components/LoadingState";
import ErrorState from "@/components/ErrorState";
import { usePushNotifications } from "@/lib/hooks/use-push-notifications";
import { onToast } from "@/lib/user-context";

export interface ServiceData {
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

export default function Dashboard() {
  const { preferences: { theme } } = useUser();
  const t = THEMES[theme];
  return (
    <ToastProvider t={t}>
      <DashboardInner />
    </ToastProvider>
  );
}

function DashboardInner() {
  const {
    user,
    isLoading: authLoading,
    isSupabaseEnabled,
    preferences: { theme, compact, myStack, sort: sortMode },
    setTheme,
    setCompact,
    setSort: setSortMode,
    toggleStack,
    setMyStack,
    notificationPrefs,
    setPushEnabled,
    signInWithGoogle,
    signInWithGitHub,
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
  const searchRef = useRef<HTMLInputElement>(null);
  const lastFetchTimeRef = useRef(Date.now());
  const [countdown, setCountdown] = useState(180);

  // Browser push notifications for My Stack services
  usePushNotifications(services, myStack, notificationPrefs.pushEnabled);

  // Bridge user-context toast events to the Toast UI
  const { showToast } = useToast();
  useEffect(() => {
    return onToast((message, type) => showToast(message, type));
  }, [showToast]);

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
    const stackParam = params.get("stack");
    if (stackParam && !user) {
      const slugs = stackParam.split(",").filter(Boolean);
      if (slugs.length > 0) {
        setMyStack(slugs);
        setShowMyStack(true);
      }
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
    lastFetchTimeRef.current = Date.now();
    setCountdown(180);
  }, []);

  useEffect(() => {
    fetchServices();
    const interval = setInterval(fetchServices, 180000); // 3 min
    return () => clearInterval(interval);
  }, []);

  // Countdown timer for next refresh
  useEffect(() => {
    const id = setInterval(() => {
      const remaining = 180 - Math.floor((Date.now() - lastFetchTimeRef.current) / 1000);
      setCountdown(Math.max(0, remaining));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  // Scroll to top when entering/leaving detail view
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [selectedSlug]);

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

  // Prevent flash of wrong theme
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

  const isSignedIn = isSupabaseEnabled && user;

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
      <AppHeader
        t={t}
        showBeta
        rightContent={
          <div
            className="sh-header-right"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <ThemeSwitcher theme={theme} setTheme={setTheme} t={t} />
            {isSignedIn && (
              <NotificationBell
                pushEnabled={notificationPrefs.pushEnabled}
                onToggle={() => setPushEnabled(!notificationPrefs.pushEnabled)}
                t={t}
              />
            )}
            {isSignedIn && <UserMenu t={t} />}
            {isSupabaseEnabled && !user && !authLoading && (
              <button
                onClick={signInWithGitHub}
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
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = t.borderHover;
                  e.currentTarget.style.background = t.surfaceHover;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = t.border;
                  e.currentTarget.style.background = "transparent";
                }}
              >
                Sign In
              </button>
            )}
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
                    Live{lastUpdated ? ` · ${lastUpdated}` : ""}{!loading && ` · ${Math.floor(countdown / 60)}:${String(countdown % 60).padStart(2, "0")}`}
                  </span>
                </div>
                {isSignedIn && (
                  <MyStackToggle
                    showMyStack={showMyStack}
                    onToggle={() => setShowMyStack(!showMyStack)}
                    count={myStack.length}
                    t={t}
                  />
                )}
                {isSignedIn && showMyStack && myStack.length > 0 && (
                  <button
                    onClick={() => {
                      const url = `${window.location.origin}/dashboard?stack=${myStack.join(",")}`;
                      navigator.clipboard.writeText(url).then(() => {
                        showToast("Stack link copied!", "success");
                      });
                    }}
                    title="Share your stack as a URL"
                    aria-label="Share stack"
                    style={{
                      background: "transparent",
                      border: `1px solid ${t.border}`,
                      borderRadius: 8,
                      width: 32,
                      height: 32,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      color: t.textMuted,
                      transition: "all 0.15s",
                      flexShrink: 0,
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
                      <polyline points="16 6 12 2 8 6" />
                      <line x1="12" y1="2" x2="12" y2="15" />
                    </svg>
                  </button>
                )}
              </>
            )}
          </div>
        }
      />

      <main
        className="sh-main"
        style={{
          maxWidth: 1120,
          margin: "0 auto",
          padding: "32px 24px 80px",
        }}
      >
        {/* Loading State */}
        {loading ? (
          <LoadingState
            t={t}
            subtitle={`Checking ${CATEGORIES.length} categories across 40+ services via official APIs...`}
          />
        ) : error && services.length === 0 ? (
          <ErrorState
            t={t}
            onRetry={() => {
              setLoading(true);
              setError(false);
              fetchServices();
            }}
          />
        ) : selectedService ? (
          <ServiceDetailView
            service={selectedService}
            onBack={() => setSelectedSlug(null)}
            isInStack={isSignedIn ? myStack.includes(selectedService.slug) : false}
            onToggleStack={() => isSignedIn && toggleStack(selectedService.slug)}
            hideStackAction={!isSignedIn}
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
                  borderRadius: 8,
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
                      borderRadius: 6,
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
                  borderRadius: 8,
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
                        fontSize: 11,
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
                            isInStack={isSignedIn ? myStack.includes(s.slug) : false}
                            onToggleStack={() => isSignedIn && toggleStack(s.slug)}
                            hideStackAction={!isSignedIn} t={t}
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
                        fontSize: 11,
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
                            isInStack={isSignedIn ? myStack.includes(s.slug) : false}
                            onToggleStack={() => isSignedIn && toggleStack(s.slug)}
                            hideStackAction={!isSignedIn} t={t}
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
                        fontSize: 11,
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
                            isInStack={isSignedIn ? myStack.includes(s.slug) : false}
                            onToggleStack={() => isSignedIn && toggleStack(s.slug)}
                            hideStackAction={!isSignedIn} t={t}
                          />
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            )}

            <AppFooter t={t}>
              <span
                style={{
                  fontSize: 11,
                  color: t.footerColor,
                  fontFamily: "var(--font-mono)",
                  letterSpacing: 0.3,
                }}
              >
                {services.length} services · Refreshes every 3 min
              </span>
            </AppFooter>
          </>
        )}
      </main>
    </div>
  );
}
