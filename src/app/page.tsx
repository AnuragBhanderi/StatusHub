"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { THEMES } from "@/config/themes";
import { services as serviceConfigs } from "@/config/services";
import { useUser } from "@/lib/user-context";
import AppHeader from "@/components/AppHeader";
import AppFooter from "@/components/AppFooter";
import LogoIcon from "@/components/LogoIcon";
import NetworkBackground from "@/components/NetworkBackground";
import SignInModal from "@/components/SignInModal";
import Link from "next/link";

interface PreviewService {
  name: string;
  slug: string;
  currentStatus: string;
  logoUrl: string | null;
  category: string;
}

/* ─── Scroll reveal hook — returns inline style + ref ─── */
function useReveal(): { ref: React.RefObject<HTMLDivElement | null>; style: React.CSSProperties } {
  const ref = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) { setRevealed(true); return; }

    // If already in viewport on mount, reveal immediately
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight + 50) {
      setRevealed(true);
      return;
    }

    const handler = () => {
      const r = el.getBoundingClientRect();
      if (r.top < window.innerHeight + 50) {
        setRevealed(true);
        window.removeEventListener("scroll", handler);
      }
    };
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const style: React.CSSProperties = revealed
    ? { opacity: 1, transform: "translateY(0)", transition: "opacity 0.7s cubic-bezier(0.16,1,0.3,1), transform 0.7s cubic-bezier(0.16,1,0.3,1)" }
    : { opacity: 0, transform: "translateY(32px)" };

  return { ref, style };
}

/* ─── Staggered scroll reveal — children cascade in one by one ─── */
function useStaggerReveal(staggerMs = 120) {
  const ref = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) { setRevealed(true); return; }
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight + 50) { setRevealed(true); return; }
    const handler = () => {
      const r = el.getBoundingClientRect();
      if (r.top < window.innerHeight + 50) {
        setRevealed(true);
        window.removeEventListener("scroll", handler);
      }
    };
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const item = (i: number): React.CSSProperties => ({
    opacity: revealed ? 1 : 0,
    transform: revealed ? "translateY(0)" : "translateY(24px)",
    transition: `opacity 0.5s cubic-bezier(0.16,1,0.3,1) ${i * staggerMs}ms, transform 0.5s cubic-bezier(0.16,1,0.3,1) ${i * staggerMs}ms`,
  });

  return { ref: ref as React.RefObject<HTMLDivElement | null>, item };
}

/* ─── Reusable section heading ─── */
function SectionLabel({ text, t }: { text: string; t: (typeof THEMES)["dark"] }) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        fontSize: 11,
        fontWeight: 700,
        color: t.accentPrimary,
        fontFamily: "var(--font-mono)",
        letterSpacing: 1.5,
        textTransform: "uppercase",
        marginBottom: 16,
      }}
    >
      <span
        style={{
          width: 16,
          height: 1,
          background: t.accentPrimary,
          opacity: 0.4,
        }}
      />
      {text}
    </div>
  );
}

/* ─── Feature detail row for showcase sections ─── */
function FeaturePoint({
  text,
  t,
}: {
  text: string;
  t: (typeof THEMES)["dark"];
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
        fontSize: 14,
        color: t.textSecondary,
        lineHeight: 1.6,
      }}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke={t.accentGreen}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ flexShrink: 0, marginTop: 3 }}
      >
        <polyline points="20 6 9 17 4 12" />
      </svg>
      <span>{text}</span>
    </div>
  );
}

/* ─── Animated counter ─── */
function AnimatedCount({ target, duration = 2500 }: { target: number; duration?: number }) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStarted(true);
          obs.disconnect();
        }
      },
      { threshold: 0.5 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!started || target === 0) return;
    const start = performance.now();
    function tick(now: number) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [started, target, duration]);

  return <span ref={ref}>{started ? count : 0}</span>;
}

export default function LandingPage() {
  const {
    user,
    isSupabaseEnabled,
    preferences: { theme },
  } = useUser();
  const t = THEMES[theme];
  const [showSignIn, setShowSignIn] = useState(false);

  // Build a slug->logoUrl map from the services config for demo sections
  const logoMap = useMemo(() => {
    const map: Record<string, string | undefined> = {};
    serviceConfigs.forEach((s) => { map[s.name.toLowerCase()] = s.logoUrl; });
    return map;
  }, []);

  const [services, setServices] = useState<PreviewService[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [allOperationalCount, setAllOperationalCount] = useState(0);
  const [categoryCount, setCategoryCount] = useState(0);
  const [hasMounted, setHasMounted] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  const [servicesLoading, setServicesLoading] = useState(true);

  useEffect(() => {
    setHasMounted(true);
    fetch("/api/services")
      .then((res) => res.json())
      .then((data) => {
        if (data.services) {
          const all: PreviewService[] = data.services;
          setTotalCount(all.length);
          setAllOperationalCount(all.filter((s) => s.currentStatus === "OPERATIONAL").length);
          setCategoryCount(new Set(all.map((s) => s.category)).size);
          // Shuffle and pick 8 random services each load
          const shuffled = [...all].sort(() => Math.random() - 0.5);
          setServices(shuffled.slice(0, 8));
        }
      })
      .catch(() => {
        setFetchError(true);
      })
      .finally(() => {
        setServicesLoading(false);
      });
  }, []);

  // Section reveal hooks
  const stepsStagger = useStaggerReveal(120);
  const feat1Reveal = useReveal();
  const feat2Reveal = useReveal();
  const feat3Reveal = useReveal();
  const feat4Reveal = useReveal();
  const pricingStagger = useStaggerReveal(150);
  const moreStagger = useStaggerReveal(80);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const ctaReveal = useReveal();

  // Back to top visibility
  useEffect(() => {
    const handler = () => setShowBackToTop(window.scrollY > 600);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  if (!hasMounted) {
    return <div style={{ minHeight: "100vh", background: "transparent" }} />;
  }

  return (
    <div
      className="theme-transition"
      style={{
        minHeight: "100vh",
        background: t.bg,
        fontFamily: "var(--font-sans)",
        color: t.text,
        overflowX: "hidden",
      }}
    >
      {/* ─── Ambient Network Background ─── */}
      <NetworkBackground t={t} />

      {/* ─── Sticky Nav ─── */}
      <AppHeader
        t={t}
        rightContent={
          <nav className="sh-landing-nav" style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {!(isSupabaseEnabled && user) && (
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
            )}
            <button
              className="sh-hide-mobile"
              onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth", block: "start" })}
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: t.textSecondary,
                background: "none",
                border: "none",
                padding: "6px 14px",
                borderRadius: 8,
                cursor: "pointer",
                fontFamily: "var(--font-sans)",
                transition: "color 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = t.text)}
              onMouseLeave={(e) => (e.currentTarget.style.color = t.textSecondary)}
            >
              Features
            </button>
            <button
              className="sh-hide-mobile"
              onClick={() => document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth", block: "start" })}
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: t.textSecondary,
                background: "none",
                border: "none",
                padding: "6px 14px",
                borderRadius: 8,
                cursor: "pointer",
                fontFamily: "var(--font-sans)",
                transition: "color 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = t.text)}
              onMouseLeave={(e) => (e.currentTarget.style.color = t.textSecondary)}
            >
              Pricing
            </button>
            {isSupabaseEnabled && !user && (
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
            {isSupabaseEnabled && user && (
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
                Dashboard
              </Link>
            )}
          </nav>
        }
      />

      {/* ─── Hero ─── */}
      <section
        className="sh-landing-hero"
        style={{
          maxWidth: 800,
          margin: "0 auto",
          padding: "100px 24px 64px",
          textAlign: "center",
          position: "relative",
        }}
      >
        {/* Hero background glow orb */}
        <div
          className="animate-hero-glow"
          style={{
            position: "absolute",
            top: "20%",
            left: "50%",
            transform: "translateX(-50%)",
            width: 500,
            height: 300,
            borderRadius: "50%",
            background: `radial-gradient(ellipse, ${t.accentPrimary}12 0%, transparent 70%)`,
            pointerEvents: "none",
            zIndex: 0,
          }}
        />

        <div style={{ position: "relative", zIndex: 1 }}>
          <div
            className={servicesLoading ? "" : "animate-fade-in"}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: servicesLoading ? `${t.textMuted}08` : `${t.accentGreen}12`,
              border: `1px solid ${servicesLoading ? t.border : `${t.accentGreen}25`}`,
              borderRadius: 20,
              padding: "5px 14px",
              marginBottom: 28,
              fontSize: 12,
              fontWeight: 600,
              color: servicesLoading ? t.textMuted : t.accentGreen,
              fontFamily: "var(--font-mono)",
              minHeight: 28,
            }}
          >
            {servicesLoading ? (
              <span style={{ opacity: 0.5 }}>Checking services...</span>
            ) : totalCount > 0 ? (
              <>
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: t.accentGreen,
                    boxShadow: `0 0 8px ${t.accentGreen}80`,
                  }}
                />
                {allOperationalCount}/{totalCount} services operational
              </>
            ) : (
              <span style={{ opacity: 0.5 }}>Status unavailable</span>
            )}
          </div>

          <h1
            className="sh-hero-title animate-fade-in"
            style={{
              fontSize: 58,
              fontWeight: 800,
              letterSpacing: -2.5,
              lineHeight: 1.08,
              margin: "0 0 22px 0",
              animationDelay: "0.1s",
              animationFillMode: "both",
            }}
          >
            One dashboard for
            <br />
            <span
              style={{
                background: `linear-gradient(135deg, ${t.accentPrimary}, ${t.accentGreen})`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              every service.
            </span>
          </h1>

          <p
            className="animate-fade-in"
            style={{
              fontSize: 17,
              color: t.textMuted,
              lineHeight: 1.65,
              maxWidth: 480,
              margin: "0 auto 36px",
              animationDelay: "0.2s",
              animationFillMode: "both",
            }}
          >
            Real-time status, instant alerts, and incident timelines
            for the services your team depends on. Free, no signup required.
          </p>

          <div
            className="sh-landing-cta-buttons animate-fade-in"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              animationDelay: "0.3s",
              animationFillMode: "both",
            }}
          >
            <Link
              href="/dashboard"
              className="sh-cta-primary"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background: t.accentPrimary,
                color: "#fff",
                border: "none",
                borderRadius: 10,
                padding: "13px 30px",
                fontSize: 15,
                fontWeight: 600,
                textDecoration: "none",
                fontFamily: "var(--font-sans)",
                transition: "all 0.2s ease",
                boxShadow: `0 0 20px ${t.accentPrimary}30`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow = `0 0 30px ${t.accentPrimary}50`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = `0 0 20px ${t.accentPrimary}30`;
              }}
            >
              Open Dashboard
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </Link>
            {isSupabaseEnabled && !user && (
              <button
                onClick={() => setShowSignIn(true)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  background: "transparent",
                  color: t.textSecondary,
                  border: `1px solid ${t.border}`,
                  borderRadius: 10,
                  padding: "13px 26px",
                  fontSize: 15,
                  fontWeight: 500,
                  cursor: "pointer",
                  fontFamily: "var(--font-sans)",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = t.borderHover;
                  e.currentTarget.style.background = t.surfaceHover;
                  e.currentTarget.style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = t.border;
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                Sign In for Alerts
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ─── Logos ribbon — social proof ─── */}
      {/* ─── Trust Stats ─── */}
      <section
        className="animate-fade-in"
        style={{
          maxWidth: 700,
          margin: "0 auto",
          padding: "0 24px 48px",
          animationDelay: "0.4s",
          animationFillMode: "both",
        }}
      >
        <div
          className="sh-trust-stats"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 0,
          }}
        >
          {[
            { value: totalCount || 43, label: "Services", isNum: true },
            { value: categoryCount || 14, label: "Categories", isNum: true },
            { value: 11, label: "Alert Types", isNum: true },
            { value: "Free", label: "Forever", isNum: false },
          ].map((s, i) => (
            <div
              key={s.label}
              style={{
                textAlign: "center",
                flex: 1,
                padding: "0 20px",
                borderRight: i < 3 ? `1px solid ${t.border}` : "none",
              }}
            >
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  color: t.text,
                  fontFamily: "var(--font-mono)",
                  letterSpacing: -0.5,
                }}
              >
                {s.isNum ? <AnimatedCount target={s.value as number} /> : s.value}
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: t.textFaint,
                  fontFamily: "var(--font-mono)",
                  letterSpacing: 0.5,
                  textTransform: "uppercase",
                  marginTop: 2,
                }}
              >
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Logos ribbon ─── */}
      <section
        style={{
          maxWidth: 700,
          margin: "0 auto",
          padding: "0 24px 60px",
          textAlign: "center",
        }}
      >
        <div
          className="animate-fade-in"
          style={{
            animationDelay: "0.5s",
            animationFillMode: "both",
            fontSize: 11,
            fontWeight: 600,
            color: t.textFaint,
            fontFamily: "var(--font-mono)",
            letterSpacing: 1.5,
            textTransform: "uppercase",
            marginBottom: 20,
          }}
        >
          Monitoring services like
        </div>
        <div
          className="animate-fade-in"
          style={{
            animationDelay: "0.55s",
            animationFillMode: "both",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 20,
            flexWrap: "wrap",
            opacity: 0.55,
          }}
        >
          {["GitHub", "AWS", "Vercel", "Stripe", "Cloudflare", "Supabase", "OpenAI"].map((name) => (
            <div
              key={name}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                transition: "opacity 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "1.6")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              <LogoIcon name={name} logoUrl={logoMap[name.toLowerCase()]} size={22} t={t} />
              <span style={{ fontSize: 12, fontWeight: 600, color: t.textMuted, fontFamily: "var(--font-sans)" }}>
                {name}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Live Preview ─── */}
      {!fetchError && (
        <section
          className="sh-landing-preview"
          style={{
            maxWidth: 1120,
            margin: "0 auto",
            padding: "0 24px 100px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 16,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 11,
                fontWeight: 700,
                color: t.textMuted,
                fontFamily: "var(--font-mono)",
                letterSpacing: 1,
                textTransform: "uppercase",
              }}
            >
              <span
                className="animate-pulse-dot"
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: t.accentGreen,
                  display: "inline-block",
                }}
              />
              Live Status
            </div>
            <Link
              href="/dashboard"
              style={{
                fontSize: 12,
                fontWeight: 500,
                color: t.accentPrimary,
                textDecoration: "none",
                fontFamily: "var(--font-sans)",
                display: "flex",
                alignItems: "center",
                gap: 4,
                transition: "gap 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.gap = "8px")}
              onMouseLeave={(e) => (e.currentTarget.style.gap = "4px")}
            >
              {totalCount > 0 ? `View all ${totalCount} services` : "View all services"}
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </Link>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
              gap: 8,
            }}
          >
            {servicesLoading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="sh-skeleton-pulse"
                    style={{
                      background: t.surface,
                      border: `1px solid ${t.border}`,
                      borderRadius: 10,
                      padding: "14px 16px",
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      animationDelay: `${i * 0.06}s`,
                    }}
                  >
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        background: t.logoBg,
                        border: `1px solid ${t.logoBorder}`,
                        flexShrink: 0,
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          width: "60%",
                          height: 13,
                          borderRadius: 4,
                          background: t.logoBg,
                          marginBottom: 6,
                        }}
                      />
                      <div
                        style={{
                          width: "40%",
                          height: 10,
                          borderRadius: 4,
                          background: t.logoBg,
                        }}
                      />
                    </div>
                    <div
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: "50%",
                        background: t.logoBg,
                        flexShrink: 0,
                      }}
                    />
                  </div>
                ))
              : services.map((s, i) => {
                  const isOp = s.currentStatus === "OPERATIONAL";
                  return (
                    <Link
                      key={s.slug}
                      href={`/dashboard?service=${s.slug}`}
                      className="animate-fade-in"
                      style={{
                        animationDelay: `${i * 0.05}s`,
                        background: t.surface,
                        border: `1px solid ${isOp ? t.border : "rgba(239,68,68,0.25)"}`,
                        borderRadius: 10,
                        padding: "14px 16px",
                        textDecoration: "none",
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        transition: "all 0.2s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = t.borderHover;
                        e.currentTarget.style.transform = "translateY(-2px)";
                        e.currentTarget.style.boxShadow = t.shadowMd;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = isOp
                          ? t.border
                          : "rgba(239,68,68,0.25)";
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "none";
                      }}
                    >
                      <LogoIcon name={s.name} logoUrl={s.logoUrl} size={32} t={t} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: t.text,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {s.name}
                        </div>
                        <div style={{ fontSize: 11, color: t.textMuted, marginTop: 2 }}>
                          {s.category}
                        </div>
                      </div>
                      <span
                        style={{
                          width: 7,
                          height: 7,
                          borderRadius: "50%",
                          background: isOp ? "#16a34a" : "#ef4444",
                          boxShadow: `0 0 6px ${isOp ? "#16a34a" : "#ef4444"}66`,
                          flexShrink: 0,
                        }}
                      />
                    </Link>
                  );
                })}
          </div>
        </section>
      )}

      {/* ─── Fetch Error Banner ─── */}
      {!servicesLoading && services.length === 0 && fetchError && (
        <section
          style={{
            maxWidth: 1120,
            margin: "0 auto",
            padding: "0 24px 60px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              padding: "20px 24px",
              borderRadius: 10,
              background: t.surface,
              border: `1px solid ${t.border}`,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span style={{ fontSize: 13, color: t.textMuted }}>
              Live status data is temporarily unavailable.
            </span>
            <Link
              href="/dashboard"
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: t.accentPrimary,
                textDecoration: "none",
              }}
            >
              Try the dashboard
            </Link>
          </div>
        </section>
      )}

      {/* ─── How It Works ─── */}
      <section
        ref={stepsStagger.ref}
        style={{
          maxWidth: 900,
          margin: "0 auto",
          padding: "0 24px 100px",
          textAlign: "center",
        }}
      >
        <div style={stepsStagger.item(0)}>
          <SectionLabel text="How it works" t={t} />
          <h2
            style={{
              fontSize: 32,
              fontWeight: 700,
              letterSpacing: -1,
              lineHeight: 1.2,
              margin: "0 0 48px 0",
            }}
          >
            Three steps. Zero config.
          </h2>
        </div>
        <div
          className="sh-landing-steps"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 24,
          }}
        >
          {[
            {
              step: "01",
              title: "Open the dashboard",
              desc: "No signup required. Browse the full status of every service instantly.",
              icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={t.accentPrimary} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
                  <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
                </svg>
              ),
            },
            {
              step: "02",
              title: "Build your project",
              desc: "Star the services your team depends on. Organize them into projects.",
              icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={t.accentPrimary} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              ),
            },
            {
              step: "03",
              title: "Get alerted",
              desc: "Sign in to unlock email and push notifications. Know before your users do.",
              icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={t.accentPrimary} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
              ),
            },
          ].map((item, i) => (
            <div
              key={item.step}
              style={{
                padding: "32px 24px",
                borderRadius: 12,
                background: t.surface,
                border: `1px solid ${t.border}`,
                textAlign: "center",
                ...stepsStagger.item(i + 1),
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = t.borderHover;
                e.currentTarget.style.transform = "translateY(-3px)";
                e.currentTarget.style.boxShadow = t.shadowLg;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = t.border;
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 14,
                  background: `${t.accentPrimary}10`,
                  border: `1px solid ${t.accentPrimary}18`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 20px",
                  transition: "background 0.25s",
                }}
              >
                {item.icon}
              </div>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: t.accentPrimary,
                  fontFamily: "var(--font-mono)",
                  letterSpacing: 2,
                  marginBottom: 10,
                }}
              >
                STEP {item.step}
              </div>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  color: t.text,
                  marginBottom: 8,
                }}
              >
                {item.title}
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: t.textMuted,
                  lineHeight: 1.6,
                }}
              >
                {item.desc}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Feature Showcase: Real-time Monitoring ─── */}
      <section
        id="features"
        ref={feat1Reveal.ref}
        style={{
          maxWidth: 1000,
          margin: "0 auto",
          padding: "0 24px 100px",
          ...feat1Reveal.style,
        }}
      >
        <div
          className="sh-feature-row"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 48,
            alignItems: "center",
          }}
        >
          <div>
            <SectionLabel text="Real-time monitoring" t={t} />
            <h2
              style={{
                fontSize: 28,
                fontWeight: 700,
                letterSpacing: -0.5,
                lineHeight: 1.2,
                margin: "0 0 16px 0",
              }}
            >
              Every service.
              <br />
              Every 3 minutes.
            </h2>
            <p
              style={{
                fontSize: 15,
                color: t.textMuted,
                lineHeight: 1.7,
                marginBottom: 24,
              }}
            >
              We poll official status APIs directly — no scraping, no proxies.
              Component-level health breakdowns show you exactly what&apos;s
              affected.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <FeaturePoint text={`${totalCount || "40+"}  services across 10+ categories`} t={t} />
              <FeaturePoint text="Component-level health (not just service status)" t={t} />
              <FeaturePoint text="Live incident timelines with update progression" t={t} />
              <FeaturePoint text="Incident duration tracking — see outage length at a glance" t={t} />
            </div>
          </div>
          {/* Mockup: monitoring card */}
          <div
            className="animate-shimmer"
            style={{
              background: t.surface,
              border: `1px solid ${t.border}`,
              borderRadius: 14,
              padding: 24,
              boxShadow: t.shadowLg,
              transition: "transform 0.3s ease, box-shadow 0.3s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-3px)";
              e.currentTarget.style.boxShadow = `0 8px 40px ${t.accentPrimary}10`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = t.shadowLg;
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: t.textMuted, fontFamily: "var(--font-mono)", letterSpacing: 1, textTransform: "uppercase" }}>
                Component Health
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: t.accentGreen, fontFamily: "var(--font-mono)" }}>
                <span className="animate-pulse-dot" style={{ width: 5, height: 5, borderRadius: "50%", background: t.accentGreen, display: "inline-block" }} />
                Live
              </div>
            </div>
            {[
              { name: "API", status: "Operational" },
              { name: "Dashboard", status: "Operational" },
              { name: "Webhooks", status: "Degraded" },
              { name: "Git Operations", status: "Operational" },
              { name: "Actions", status: "Operational" },
            ].map((c) => {
              const isOk = c.status === "Operational";
              return (
                <div
                  key={c.name}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 0",
                    borderBottom: `1px solid ${t.borderSubtle}`,
                  }}
                >
                  <span style={{ fontSize: 13, color: t.text }}>{c.name}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span
                      style={{
                        fontSize: 11,
                        color: isOk ? t.accentGreen : "#f59e0b",
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      {c.status}
                    </span>
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: isOk ? t.accentGreen : "#f59e0b",
                      }}
                    />
                  </div>
                </div>
              );
            })}
            <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: t.textFaint, fontFamily: "var(--font-mono)" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
              </svg>
              Refreshes every 3 minutes
            </div>
          </div>
        </div>
      </section>

      {/* ─── Feature Showcase: Projects ─── */}
      <section
        ref={feat2Reveal.ref}
        style={{
          maxWidth: 1000,
          margin: "0 auto",
          padding: "0 24px 100px",
          ...feat2Reveal.style,
        }}
      >
        <div
          className="sh-feature-row sh-feature-row-reverse"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 48,
            alignItems: "center",
          }}
        >
          {/* Mockup: Project */}
          <div
            style={{
              background: t.surface,
              border: `1px solid ${t.border}`,
              borderRadius: 14,
              padding: 24,
              boxShadow: t.shadowLg,
              order: 0,
              transition: "transform 0.3s ease, box-shadow 0.3s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-3px)";
              e.currentTarget.style.boxShadow = `0 8px 40px ${t.accentPrimary}10`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = t.shadowLg;
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 16,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill={t.accentPrimary} stroke="none">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
                <span style={{ fontSize: 12, fontWeight: 700, color: t.textMuted, fontFamily: "var(--font-mono)", letterSpacing: 1, textTransform: "uppercase" }}>
                  My Project
                </span>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: t.accentPrimary,
                    background: `${t.accentPrimary}12`,
                    padding: "2px 6px",
                    borderRadius: 4,
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  5
                </span>
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: t.accentPrimary,
                  fontFamily: "var(--font-mono)",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
                Share
              </div>
            </div>
            {["Vercel", "GitHub", "Supabase", "Stripe", "Cloudflare"].map(
              (name, i) => (
                <div
                  key={name}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 12px",
                    borderRadius: 8,
                    background: i === 0 ? `${t.accentPrimary}06` : "transparent",
                    marginBottom: 4,
                    transition: "background 0.15s",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <LogoIcon name={name} logoUrl={logoMap[name.toLowerCase()]} size={28} t={t} />
                    <span style={{ fontSize: 13, fontWeight: 500, color: t.text }}>
                      {name}
                    </span>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill={t.accentPrimary} stroke="none" style={{ opacity: 0.7 }}>
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                </div>
              )
            )}
            <div
              style={{
                marginTop: 12,
                padding: "10px 14px",
                borderRadius: 8,
                background: `${t.accentPrimary}08`,
                border: `1px solid ${t.accentPrimary}15`,
                fontSize: 11,
                color: t.textMuted,
                fontFamily: "var(--font-mono)",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={t.accentPrimary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
              <span style={{ color: t.textFaint }}>
                statushub.orphilia.com/dashboard?s=k8m2x
              </span>
            </div>
          </div>
          <div style={{ order: 1 }}>
            <SectionLabel text="Projects" t={t} />
            <h2
              style={{
                fontSize: 28,
                fontWeight: 700,
                letterSpacing: -0.5,
                lineHeight: 1.2,
                margin: "0 0 16px 0",
              }}
            >
              Your services.
              <br />
              Your dashboard.
            </h2>
            <p
              style={{
                fontSize: 15,
                color: t.textMuted,
                lineHeight: 1.7,
                marginBottom: 24,
              }}
            >
              Organize the services your product depends on into projects.
              Filter the dashboard to just what matters. Share with your team.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <FeaturePoint text="One-click star to add services to your project" t={t} />
              <FeaturePoint text="Shareable project URLs for team coordination" t={t} />
              <FeaturePoint text="Filter view to see only what matters to you" t={t} />
              <FeaturePoint text="Cloud sync — projects follow you across devices" t={t} />
            </div>
          </div>
        </div>
      </section>

      {/* ─── Feature Showcase: Notifications & Alerts (PREMIUM) ─── */}
      <section
        ref={feat3Reveal.ref}
        style={{
          maxWidth: 1000,
          margin: "0 auto",
          padding: "0 24px 100px",
          ...feat3Reveal.style,
        }}
      >
        <div
          className="sh-feature-row"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 48,
            alignItems: "center",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <SectionLabel text="Notifications" t={t} />
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  color: t.accentPrimary,
                  background: `${t.accentPrimary}12`,
                  padding: "3px 8px",
                  borderRadius: 4,
                  fontFamily: "var(--font-mono)",
                  letterSpacing: 1,
                  textTransform: "uppercase",
                  marginBottom: 16,
                }}
              >
                Premium
              </span>
            </div>
            <h2
              style={{
                fontSize: 28,
                fontWeight: 700,
                letterSpacing: -0.5,
                lineHeight: 1.2,
                margin: "0 0 16px 0",
              }}
            >
              Know before
              <br />
              your users do.
            </h2>
            <p
              style={{
                fontSize: 15,
                color: t.textMuted,
                lineHeight: 1.7,
                marginBottom: 24,
              }}
            >
              Get instant alerts through email and browser push notifications.
              Choose exactly which event types trigger alerts — from major outages
              to scheduled maintenance.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <FeaturePoint text="Email alerts with custom address support" t={t} />
              <FeaturePoint text="Browser push notifications for instant awareness" t={t} />
              <FeaturePoint text="5 granular event types — pick exactly what you need" t={t} />
              <FeaturePoint text="One-click test email to verify your setup" t={t} />
              <FeaturePoint text="Only alerts for your project services — no noise" t={t} />
            </div>
          </div>
          {/* Mockup: Notification settings */}
          <div
            style={{
              background: t.surface,
              border: `1px solid ${t.border}`,
              borderRadius: 14,
              padding: 24,
              boxShadow: t.shadowLg,
              transition: "transform 0.3s ease, box-shadow 0.3s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-3px)";
              e.currentTarget.style.boxShadow = `0 8px 40px ${t.accentPrimary}10`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = t.shadowLg;
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 600, color: t.text, marginBottom: 4 }}>
              Email Notifications
            </div>
            <div style={{ fontSize: 12, color: t.textMuted, marginBottom: 20 }}>
              Choose which events trigger an email alert
            </div>
            {[
              { label: "Major Outages", desc: "Complete service failures", on: true },
              { label: "Partial Outages", desc: "Some features unavailable", on: true },
              { label: "Degraded Performance", desc: "Slower than normal", on: true },
              { label: "Maintenance Windows", desc: "Planned downtime", on: false },
              { label: "Service Recoveries", desc: "When services come back", on: true },
            ].map((n) => (
              <div
                key={n.label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 0",
                  borderBottom: `1px solid ${t.borderSubtle}`,
                }}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: t.text }}>{n.label}</div>
                  <div style={{ fontSize: 11, color: t.textFaint, marginTop: 1 }}>{n.desc}</div>
                </div>
                <div
                  style={{
                    width: 34,
                    height: 18,
                    borderRadius: 9,
                    background: n.on ? t.accentPrimary : `${t.textFaint}40`,
                    position: "relative",
                    flexShrink: 0,
                    transition: "background 0.15s",
                  }}
                >
                  <div
                    style={{
                      width: 14,
                      height: 14,
                      borderRadius: "50%",
                      background: "#fff",
                      position: "absolute",
                      top: 2,
                      left: n.on ? 18 : 2,
                      transition: "left 0.15s",
                      boxShadow: "0 1px 2px rgba(0,0,0,0.2)",
                    }}
                  />
                </div>
              </div>
            ))}
            <div
              style={{
                marginTop: 16,
                display: "flex",
                gap: 8,
              }}
            >
              <div
                style={{
                  flex: 1,
                  padding: "8px 12px",
                  borderRadius: 6,
                  border: `1px solid ${t.border}`,
                  background: t.bg,
                  fontSize: 12,
                  color: t.textFaint,
                  fontFamily: "var(--font-sans)",
                }}
              >
                you@company.com
              </div>
              <div
                style={{
                  padding: "8px 14px",
                  borderRadius: 6,
                  background: t.accentPrimary,
                  color: "#fff",
                  fontSize: 12,
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                Test
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Feature Showcase: Incident Intelligence ─── */}
      <section
        ref={feat4Reveal.ref}
        style={{
          maxWidth: 1000,
          margin: "0 auto",
          padding: "0 24px 100px",
          ...feat4Reveal.style,
        }}
      >
        <div
          className="sh-feature-row sh-feature-row-reverse"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 48,
            alignItems: "center",
          }}
        >
          {/* Mockup: Incident timeline */}
          <div
            style={{
              background: t.surface,
              border: `1px solid ${t.border}`,
              borderRadius: 14,
              padding: 24,
              boxShadow: t.shadowLg,
              order: 0,
              transition: "transform 0.3s ease, box-shadow 0.3s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-3px)";
              e.currentTarget.style.boxShadow = `0 8px 40px ${t.accentPrimary}10`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = t.shadowLg;
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: t.text }}>
                Elevated Error Rates
              </div>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: "#ef4444",
                  background: "rgba(239,68,68,0.10)",
                  padding: "3px 8px",
                  borderRadius: 4,
                  fontFamily: "var(--font-mono)",
                }}
              >
                2h 14m
              </span>
            </div>
            {[
              { status: "Investigating", time: "2:14 PM", text: "We are investigating elevated error rates for API requests.", color: "#ef4444" },
              { status: "Identified", time: "2:28 PM", text: "The issue has been identified and a fix is being deployed.", color: "#f59e0b" },
              { status: "Monitoring", time: "2:52 PM", text: "A fix has been deployed. We are monitoring the results.", color: "#6366f1" },
              { status: "Resolved", time: "4:28 PM", text: "This incident has been resolved. All systems operational.", color: "#16a34a" },
            ].map((update, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: 14,
                  paddingBottom: i < 3 ? 16 : 0,
                  marginBottom: i < 3 ? 16 : 0,
                  borderBottom: i < 3 ? `1px solid ${t.borderSubtle}` : "none",
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: update.color,
                      flexShrink: 0,
                      marginTop: 5,
                      boxShadow: `0 0 6px ${update.color}40`,
                    }}
                  />
                  {i < 3 && (
                    <div style={{ width: 1, flex: 1, background: `${t.border}`, minHeight: 20 }} />
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: update.color, fontFamily: "var(--font-mono)" }}>
                      {update.status}
                    </span>
                    <span style={{ fontSize: 10, color: t.textFaint, fontFamily: "var(--font-mono)" }}>
                      {update.time}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: t.textMuted, lineHeight: 1.5 }}>
                    {update.text}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ order: 1 }}>
            <SectionLabel text="Incident Intelligence" t={t} />
            <h2
              style={{
                fontSize: 28,
                fontWeight: 700,
                letterSpacing: -0.5,
                lineHeight: 1.2,
                margin: "0 0 16px 0",
              }}
            >
              Full incident
              <br />
              visibility.
            </h2>
            <p
              style={{
                fontSize: 15,
                color: t.textMuted,
                lineHeight: 1.7,
                marginBottom: 24,
              }}
            >
              See every incident as it happens — from initial investigation through
              resolution. Track how long outages last and drill into the full
              update timeline.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <FeaturePoint text="Status progression: Investigating → Identified → Monitoring → Resolved" t={t} />
              <FeaturePoint text="Live duration tracking for ongoing incidents" t={t} />
              <FeaturePoint text="Full update timeline with timestamps" t={t} />
              <FeaturePoint text="Separate tracking for monitoring-only incidents" t={t} />
            </div>
          </div>
        </div>
      </section>

      {/* ─── Pricing / Free vs Premium ─── */}
      <section
        id="pricing"
        ref={pricingStagger.ref}
        style={{
          maxWidth: 800,
          margin: "0 auto",
          padding: "0 24px 100px",
          textAlign: "center",
        }}
      >
        <div style={pricingStagger.item(0)}>
          <SectionLabel text="Pricing" t={t} />
          <h2
            style={{
              fontSize: 32,
              fontWeight: 700,
              letterSpacing: -1,
              lineHeight: 1.2,
              margin: "0 0 12px 0",
            }}
          >
            Free forever. Premium when you need it.
          </h2>
          <p
            style={{
              fontSize: 15,
              color: t.textMuted,
              lineHeight: 1.6,
              maxWidth: 520,
              margin: "0 auto 40px",
            }}
          >
            The full dashboard is free. Upgrade to Pro for more projects,
            more services, and premium features.
          </p>
        </div>
        <div
          className="sh-pricing-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 16,
            textAlign: "left",
          }}
        >
          {/* Free tier */}
          <div
            style={{
              padding: 28,
              borderRadius: 14,
              background: t.surface,
              border: `1px solid ${t.border}`,
              ...pricingStagger.item(1),
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = t.borderHover;
              e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = t.border;
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, color: t.textMuted, fontFamily: "var(--font-mono)", letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>
              Free
            </div>
            <div style={{ fontSize: 36, fontWeight: 800, letterSpacing: -1.5, color: t.text, marginBottom: 4 }}>
              $0
            </div>
            <div style={{ fontSize: 13, color: t.textFaint, marginBottom: 24 }}>
              No signup required
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                "Full dashboard access",
                `All ${totalCount || "40+"} services monitored`,
                "1 project, 5 services",
                "Email & push notifications",
                "Search, filter & sort",
                "Service detail & incident history",
                "3 themes (dark, light, midnight)",
              ].map((f) => (
                <div
                  key={f}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontSize: 13,
                    color: t.textSecondary,
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={t.accentGreen} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  {f}
                </div>
              ))}
            </div>
            <Link
              href="/dashboard"
              style={{
                display: "block",
                textAlign: "center",
                marginTop: 28,
                padding: "11px 0",
                borderRadius: 8,
                border: `1px solid ${t.border}`,
                color: t.textSecondary,
                fontSize: 14,
                fontWeight: 600,
                textDecoration: "none",
                fontFamily: "var(--font-sans)",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = t.borderHover;
                (e.currentTarget as HTMLElement).style.background = t.surfaceHover;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = t.border;
                (e.currentTarget as HTMLElement).style.background = "transparent";
              }}
            >
              Open Dashboard
            </Link>
          </div>
          {/* Premium tier */}
          <div
            style={{
              padding: 28,
              borderRadius: 14,
              background: t.surface,
              border: `1px solid ${t.accentPrimary}35`,
              position: "relative",
              boxShadow: `0 0 30px ${t.accentPrimary}08`,
              ...pricingStagger.item(2),
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = t.accentPrimary;
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = `0 0 40px ${t.accentPrimary}15`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = `${t.accentPrimary}35`;
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = `0 0 30px ${t.accentPrimary}08`;
            }}
          >
            <div
              style={{
                position: "absolute",
                top: -10,
                right: 20,
                fontSize: 10,
                fontWeight: 700,
                color: "#fff",
                background: `linear-gradient(135deg, ${t.accentPrimary}, ${t.accentSecondary})`,
                padding: "3px 10px",
                borderRadius: 4,
                fontFamily: "var(--font-mono)",
                letterSpacing: 0.5,
              }}
            >
              RECOMMENDED
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: t.accentPrimary, fontFamily: "var(--font-mono)", letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>
              Pro
            </div>
            <div style={{ fontSize: 36, fontWeight: 800, letterSpacing: -1.5, color: t.text, marginBottom: 4 }}>
              $6<span style={{ fontSize: 14, fontWeight: 500, color: t.textFaint }}>/month</span>
            </div>
            <div style={{ fontSize: 13, color: t.textFaint, marginBottom: 24 }}>
              For teams and power users
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                "Everything in Free",
                "3 projects, 7 services each",
                "All 11 notification event types",
                "Granular alert controls",
                "Cloud-synced preferences",
                "Public status pages (coming soon)",
                "Uptime reports (coming soon)",
                "Weekly digest email (coming soon)",
              ].map((f) => (
                <div
                  key={f}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontSize: 13,
                    color: t.textSecondary,
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={t.accentPrimary} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  {f}
                </div>
              ))}
            </div>
            <Link
              href="/dashboard"
              style={{
                display: "block",
                textAlign: "center",
                marginTop: 28,
                padding: "11px 0",
                borderRadius: 8,
                border: "none",
                background: `linear-gradient(135deg, ${t.accentPrimary}, ${t.accentSecondary})`,
                color: "#fff",
                fontSize: 14,
                fontWeight: 600,
                textDecoration: "none",
                fontFamily: "var(--font-sans)",
                transition: "all 0.2s ease",
                boxShadow: `0 2px 12px ${t.accentPrimary}30`,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 20px ${t.accentPrimary}50`;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow = `0 2px 12px ${t.accentPrimary}30`;
              }}
            >
              Get Started
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Additional Features Grid ─── */}
      <section
        ref={moreStagger.ref}
        style={{
          maxWidth: 1000,
          margin: "0 auto",
          padding: "0 24px 100px",
          textAlign: "center",
        }}
      >
        <div style={moreStagger.item(0)}>
          <SectionLabel text="And more" t={t} />
          <h2
            style={{
              fontSize: 28,
              fontWeight: 700,
              letterSpacing: -0.5,
              lineHeight: 1.2,
              margin: "0 0 40px 0",
            }}
          >
            Built for developers.
          </h2>
        </div>
        <div
          className="sh-landing-features-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 12,
          }}
        >
          {[
            {
              title: "Keyboard First",
              desc: "Cmd+K to search, Esc to close. Designed for speed.",
              icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={t.accentPrimary} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="4" width="20" height="16" rx="2" /><path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M8 12h.01M12 12h.01M16 12h.01M7 16h10" />
                </svg>
              ),
            },
            {
              title: "3 Themes",
              desc: "Dark, Light, and Midnight. Switch instantly.",
              icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={t.accentPrimary} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              ),
            },
            {
              title: "10+ Categories",
              desc: "Cloud, DevOps, AI/ML, Payments, Design, and more.",
              icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={t.accentPrimary} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
                </svg>
              ),
            },
            {
              title: "Compact View",
              desc: "Dense or comfortable. Toggle between scan and detail modes.",
              icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={t.accentPrimary} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="3" y1="15" x2="21" y2="15" />
                </svg>
              ),
            },
            {
              title: "Zero Config",
              desc: "No API keys, no setup. Just open and start monitoring.",
              icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={t.accentPrimary} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ),
            },
            {
              title: "Official APIs",
              desc: "Direct integration with official status APIs. No scraping.",
              icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={t.accentPrimary} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                </svg>
              ),
            },
          ].map((f, i) => (
            <div
              key={f.title}
              style={{
                padding: "24px 20px",
                borderRadius: 12,
                background: t.surface,
                border: `1px solid ${t.border}`,
                textAlign: "left",
                ...moreStagger.item(i + 1),
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = t.borderHover;
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = t.shadowMd;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = t.border;
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: `${t.accentPrimary}10`,
                  border: `1px solid ${t.accentPrimary}18`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 14,
                }}
              >
                {f.icon}
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: t.text, marginBottom: 6 }}>
                {f.title}
              </div>
              <div style={{ fontSize: 13, color: t.textMuted, lineHeight: 1.5 }}>
                {f.desc}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Final CTA ─── */}
      <section
        ref={ctaReveal.ref}
        style={{
          maxWidth: 640,
          margin: "0 auto",
          padding: "0 24px 100px",
          textAlign: "center",
          ...ctaReveal.style,
        }}
      >
        <div
          style={{
            background: t.surface,
            border: `1px solid ${t.border}`,
            borderRadius: 16,
            padding: "56px 32px",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Subtle gradient overlay */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 1,
              background: `linear-gradient(90deg, transparent, ${t.accentPrimary}30, transparent)`,
            }}
          />
          <h2
            style={{
              fontSize: 28,
              fontWeight: 700,
              letterSpacing: -0.5,
              lineHeight: 1.3,
              margin: "0 0 12px 0",
            }}
          >
            Don&apos;t wait for your users
            <br />
            to tell you about outages.
          </h2>
          <p
            style={{
              fontSize: 14,
              color: t.textMuted,
              lineHeight: 1.6,
              marginBottom: 32,
              maxWidth: 420,
              marginLeft: "auto",
              marginRight: "auto",
            }}
          >
            Start monitoring the services your product depends on. Set up
            alerts in seconds. Free and zero configuration.
          </p>
          <div
            className="sh-landing-cta-buttons"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
            }}
          >
            <Link
              href="/dashboard"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background: `linear-gradient(135deg, ${t.accentPrimary}, ${t.accentSecondary})`,
                color: "#fff",
                border: "none",
                borderRadius: 10,
                padding: "13px 30px",
                fontSize: 15,
                fontWeight: 600,
                textDecoration: "none",
                fontFamily: "var(--font-sans)",
                transition: "all 0.2s ease",
                boxShadow: `0 2px 16px ${t.accentPrimary}30`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow = `0 4px 24px ${t.accentPrimary}50`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = `0 2px 16px ${t.accentPrimary}30`;
              }}
            >
              Open Dashboard
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </Link>
            {isSupabaseEnabled && !user && (
              <button
                onClick={() => setShowSignIn(true)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  background: "transparent",
                  color: t.textSecondary,
                  border: `1px solid ${t.border}`,
                  borderRadius: 10,
                  padding: "13px 26px",
                  fontSize: 15,
                  fontWeight: 500,
                  cursor: "pointer",
                  fontFamily: "var(--font-sans)",
                  transition: "all 0.2s ease",
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
                Sign In for Alerts
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <AppFooter t={t} />

      {/* ─── Back to Top ─── */}
      <button
        onClick={scrollToTop}
        aria-label="Back to top"
        style={{
          position: "fixed",
          bottom: 28,
          right: 28,
          width: 40,
          height: 40,
          borderRadius: 10,
          background: t.surface,
          border: `1px solid ${t.border}`,
          color: t.textMuted,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: t.shadowMd,
          zIndex: 100,
          transition: "all 0.3s cubic-bezier(0.16,1,0.3,1)",
          opacity: showBackToTop ? 1 : 0,
          transform: showBackToTop ? "translateY(0)" : "translateY(12px)",
          pointerEvents: showBackToTop ? "auto" : "none",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = t.borderHover;
          e.currentTarget.style.color = t.text;
          e.currentTarget.style.transform = "translateY(-2px)";
          e.currentTarget.style.boxShadow = t.shadowLg;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = t.border;
          e.currentTarget.style.color = t.textMuted;
          e.currentTarget.style.transform = showBackToTop ? "translateY(0)" : "translateY(12px)";
          e.currentTarget.style.boxShadow = t.shadowMd;
        }}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="18 15 12 9 6 15" />
        </svg>
      </button>

      {/* Sign In Modal */}
      {showSignIn && <SignInModal t={t} onClose={() => setShowSignIn(false)} />}
    </div>
  );
}
