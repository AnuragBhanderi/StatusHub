"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { THEMES, type ThemeKey } from "@/config/themes";
import { CATEGORIES } from "@/config/services";
import { STATUS_DISPLAY } from "@/lib/normalizer";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import StatusBanner from "@/components/StatusBanner";
import SearchBar from "@/components/SearchBar";
import CategoryPills from "@/components/CategoryPills";
import ServiceCard from "@/components/ServiceCard";
import MyStackToggle from "@/components/MyStackToggle";
import ServiceDetailView from "@/components/ServiceDetailView";

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
}

export default function Home() {
  const [theme, setTheme] = useState<ThemeKey>("dark");
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [myStack, setMyStack] = useState<string[]>([]);
  const [showMyStack, setShowMyStack] = useState(false);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState("");
  const [services, setServices] = useState<ServiceData[]>([]);
  const [hasMounted, setHasMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Load persisted state from localStorage and read URL params on mount
  useEffect(() => {
    setHasMounted(true);
    const savedTheme = localStorage.getItem("statushub_theme") as ThemeKey;
    if (savedTheme && THEMES[savedTheme]) {
      setTheme(savedTheme);
    }
    const savedStack = localStorage.getItem("statushub_my_stack");
    if (savedStack) {
      try {
        setMyStack(JSON.parse(savedStack));
      } catch {
        // ignore
      }
    }
    // Read ?service= query param (used by /service/[slug] redirect)
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

  // Persist theme
  useEffect(() => {
    if (hasMounted) {
      localStorage.setItem("statushub_theme", theme);
    }
  }, [theme, hasMounted]);

  // Persist stack
  useEffect(() => {
    if (hasMounted) {
      localStorage.setItem("statushub_my_stack", JSON.stringify(myStack));
    }
  }, [myStack, hasMounted]);

  const t = THEMES[theme];

  const toggleStack = useCallback(
    (slug: string) =>
      setMyStack((prev) =>
        prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
      ),
    []
  );

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
    return list.sort((a, b) => {
      const orderA = STATUS_DISPLAY[a.currentStatus]?.order ?? 5;
      const orderB = STATUS_DISPLAY[b.currentStatus]?.order ?? 5;
      return orderA - orderB;
    });
  }, [search, activeCategory, showMyStack, myStack, services]);

  const operational = services.filter(
    (s) => s.currentStatus === "OPERATIONAL"
  ).length;
  const issues = services.length - operational;
  const servicesWithIssues = services.filter(
    (s) => s.currentStatus !== "OPERATIONAL"
  );

  const selectedService = selectedSlug
    ? services.find((s) => s.slug === selectedSlug) || null
    : null;

  // Prevent flash of wrong theme
  if (!hasMounted) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#0c0c10",
        }}
      />
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
            <span
              style={{
                fontSize: 9,
                fontWeight: 700,
                color: t.betaText,
                background: t.betaBg,
                padding: "3px 8px",
                borderRadius: 5,
                fontFamily: "var(--font-mono)",
                letterSpacing: 1.5,
              }}
            >
              BETA
            </span>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
            }}
          >
            <ThemeSwitcher theme={theme} setTheme={setTheme} t={t} />
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
                    }}
                  />
                  <span
                    style={{
                      fontSize: 11,
                      color: t.textFaint,
                      fontFamily: "var(--font-mono)",
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
                background: "rgba(255,82,82,0.08)",
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
                stroke="#ff5252"
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
              t={t}
            />

            <SearchBar value={search} onChange={setSearch} t={t} />

            <CategoryPills
              categories={CATEGORIES}
              active={activeCategory}
              onChange={setActiveCategory}
              t={t}
            />

            {filtered.length === 0 ? (
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
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fill, minmax(290px, 1fr))",
                  gap: 10,
                }}
              >
                {filtered.map((s, i) => (
                  <div
                    key={s.slug}
                    className="animate-slide-up"
                    style={{
                      animationDelay: `${i * 0.025}s`,
                    }}
                  >
                    <ServiceCard
                      name={s.name}
                      slug={s.slug}
                      currentStatus={s.currentStatus}
                      logoUrl={s.logoUrl}
                      latestIncident={s.latestIncident}
                      onClick={() => setSelectedSlug(s.slug)}
                      isInStack={myStack.includes(s.slug)}
                      onToggleStack={() => toggleStack(s.slug)}
                      t={t}
                    />
                  </div>
                ))}
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
