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

/* ─── Scroll reveal hook ─── */
function useReveal(): {
  ref: React.RefObject<HTMLDivElement | null>;
  style: React.CSSProperties;
} {
  const ref = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) {
      setRevealed(true);
      return;
    }
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
    ? {
        opacity: 1,
        transform: "translateY(0)",
        transition:
          "opacity 0.7s cubic-bezier(0.16,1,0.3,1), transform 0.7s cubic-bezier(0.16,1,0.3,1)",
      }
    : { opacity: 0, transform: "translateY(32px)" };

  return { ref, style };
}

export default function LandingPage() {
  const {
    user,
    isSupabaseEnabled,
    signInWithGoogle,
    signInWithGitHub,
    preferences: { theme },
  } = useUser();
  const t = THEMES[theme];
  const [showSignIn, setShowSignIn] = useState(false);

  const logoMap = useMemo(() => {
    const map: Record<string, string | undefined> = {};
    serviceConfigs.forEach((s) => {
      map[s.name.toLowerCase()] = s.logoUrl;
    });
    return map;
  }, []);

  const [services, setServices] = useState<PreviewService[]>([]);
  const [totalCount, setTotalCount] = useState(serviceConfigs.length);
  const [categoryCount, setCategoryCount] = useState(0);
  const [hasMounted, setHasMounted] = useState(false);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [lastFetchTime, setLastFetchTime] = useState<number | null>(null);
  const [secondsAgo, setSecondsAgo] = useState(0);
  const [showExitIntent, setShowExitIntent] = useState(false);
  const [isReturningVisitor, setIsReturningVisitor] = useState(false);

  const fetchServices = useCallback(() => {
    fetch("/api/services")
      .then((res) => res.json())
      .then((data) => {
        if (data.services) {
          const all: PreviewService[] = data.services;
          setTotalCount(all.length);
          setCategoryCount(new Set(all.map((s) => s.category)).size);
          const curated = [
            "github", "aws", "vercel", "stripe",
            "openai", "cloudflare", "slack", "datadog",
          ];
          const curatedSet = new Set(curated);
          const picked: PreviewService[] = [];
          const bySlug = new Map(all.map((s) => [s.slug, s]));
          for (const slug of curated) {
            const s = bySlug.get(slug);
            if (s) picked.push(s);
          }
          for (const s of all) {
            if (s.currentStatus !== "OPERATIONAL" && !curatedSet.has(s.slug)) {
              picked.unshift(s);
            }
          }
          setServices(picked.slice(0, 8));
          setLastFetchTime(Date.now());
        }
      })
      .catch(() => {})
      .finally(() => {
        setServicesLoading(false);
      });
  }, []);

  useEffect(() => {
    setHasMounted(true);
    fetchServices();
    const interval = setInterval(fetchServices, 60000);
    return () => clearInterval(interval);
  }, [fetchServices]);

  // Live urgency ticker — shows seconds since last data refresh
  useEffect(() => {
    if (!lastFetchTime) return;
    const interval = setInterval(() => {
      setSecondsAgo(Math.floor((Date.now() - lastFetchTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [lastFetchTime]);

  // Return visitor detection
  useEffect(() => {
    try {
      if (localStorage.getItem("sh_visited")) setIsReturningVisitor(true);
      localStorage.setItem("sh_visited", "1");
    } catch {}
  }, []);

  // Exit intent — fires once when cursor leaves viewport (desktop only)
  useEffect(() => {
    if (!isSupabaseEnabled || user) return;
    const handler = (e: MouseEvent) => {
      if (e.clientY <= 0 && !sessionStorage.getItem("sh_exit_dismissed")) {
        setShowExitIntent(true);
        document.removeEventListener("mouseout", handler);
      }
    };
    const timeout = setTimeout(() => {
      document.addEventListener("mouseout", handler);
    }, 5000);
    return () => {
      clearTimeout(timeout);
      document.removeEventListener("mouseout", handler);
    };
  }, [isSupabaseEnabled, user]);

  const proofReveal = useReveal();

  if (!hasMounted) {
    return <div style={{ minHeight: "100vh", background: "transparent" }} />;
  }

  const dismissExitIntent = () => {
    setShowExitIntent(false);
    try { sessionStorage.setItem("sh_exit_dismissed", "1"); } catch {}
  };

  const handlePrimaryCTA = () => {
    if (isSupabaseEnabled && !user) {
      setShowSignIn(true);
    } else {
      window.location.href = "/dashboard";
    }
  };

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
      <NetworkBackground t={t} />

      {/* ─── Sticky Nav ─── */}
      <AppHeader
        t={t}
        rightContent={
          <nav
            className="sh-landing-nav"
            style={{ display: "flex", alignItems: "center", gap: 6 }}
          >
            {isSupabaseEnabled && !user ? (
              <>
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
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.opacity = "0.9")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.opacity = "1")
                  }
                >
                  Sign In
                </button>
              </>
            ) : (
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

      {/* ═══════════════════════════════════════════════════════
          SECTION 1 — HERO
          ═══════════════════════════════════════════════════════ */}
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
        {/* Glow orb */}
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
          {/* Return visitor urgency nudge — action-oriented, not passive */}
          {isReturningVisitor && !servicesLoading && (
            <p
              className="animate-fade-in"
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: services.some((s) => s.currentStatus !== "OPERATIONAL")
                  ? "#ef4444"
                  : t.textMuted,
                marginBottom: 20,
                fontFamily: "var(--font-mono)",
                letterSpacing: 0.2,
              }}
            >
              {services.some((s) => s.currentStatus !== "OPERATIONAL")
                ? `${services.find((s) => s.currentStatus !== "OPERATIONAL")?.name} is reporting issues — are you getting notified?`
                : "Welcome back — your stack is still unmonitored"}
            </p>
          )}

          {/* Headline — pain first */}
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
            Stop checking 10
            <br />
            status pages.{" "}
            <span
              style={{
                background: `linear-gradient(135deg, ${t.accentPrimary}, ${t.accentGreen})`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Check one.
            </span>
          </h1>

          {/* Subheadline */}
          <p
            className="animate-fade-in"
            style={{
              fontSize: 17,
              color: t.textMuted,
              lineHeight: 1.65,
              maxWidth: 520,
              margin: "0 auto 36px",
              animationDelay: "0.2s",
              animationFillMode: "both",
            }}
          >
            Know in 2 seconds if your stack is down.
            <br />
            Get alerted before your users notice.
          </p>

          {/* Inline proof strip — product working above the fold */}
          {!servicesLoading && services.length > 0 && (
            <div
              className="animate-fade-in"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 16,
                marginBottom: 28,
                animationDelay: "0.25s",
                animationFillMode: "both",
                flexWrap: "wrap",
              }}
            >
              {services.filter((s) => ["github", "aws", "vercel", "stripe", "openai"].includes(s.slug)).slice(0, 5).map((s) => {
                const isOp = s.currentStatus === "OPERATIONAL";
                return (
                  <span
                    key={s.slug}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5,
                      fontSize: 12,
                      fontWeight: 500,
                      color: t.textMuted,
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    <span
                      style={{
                        width: 5,
                        height: 5,
                        borderRadius: "50%",
                        background: isOp ? "#16a34a" : "#ef4444",
                        boxShadow: `0 0 4px ${isOp ? "#16a34a" : "#ef4444"}66`,
                        flexShrink: 0,
                      }}
                    />
                    {s.name}
                  </span>
                );
              })}
              <span
                style={{
                  fontSize: 11,
                  color: t.textMuted,
                  opacity: 0.5,
                  fontFamily: "var(--font-mono)",
                }}
              >
                +{totalCount - 5} more
              </span>
            </div>
          )}

          {/* CTA buttons */}
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
            {isSupabaseEnabled && !user ? (
              <button
                onClick={handlePrimaryCTA}
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
                  cursor: "pointer",
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
                {isReturningVisitor ? "Start Your Free Trial" : "Get Free Alerts"}
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
              </button>
            ) : (
              <Link
                href="/dashboard"
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
            )}
          </div>

          {/* Free trial note — urgency + low friction */}
          {isSupabaseEnabled && !user && (
            <p
              className="animate-fade-in"
              style={{
                fontSize: 12,
                color: t.textMuted,
                marginTop: 16,
                fontFamily: "var(--font-mono)",
                letterSpacing: 0.3,
                opacity: 0.7,
                animationDelay: "0.4s",
                animationFillMode: "both",
              }}
            >
              One click · Pro trial included · No credit card
            </p>
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          SECTION 2 — LIVE DASHBOARD GRID
          ═══════════════════════════════════════════════════════ */}
      <section
        style={{
          maxWidth: 1120,
          margin: "0 auto",
          padding: "0 24px 80px",
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
            {lastFetchTime && (
              <span
                style={{
                  fontWeight: 400,
                  textTransform: "none",
                  letterSpacing: 0,
                  opacity: 0.6,
                  fontSize: 10,
                }}
              >
                {" "}· {secondsAgo < 3 ? "Just now" : `${secondsAgo}s ago`}
              </span>
            )}
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
            Explore all {totalCount} services
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
          className="sh-live-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
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
                    animationDelay: `${i * 0.04}s`,
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
                        width: "55%",
                        height: 13,
                        borderRadius: 4,
                        background: t.logoBg,
                        marginBottom: 6,
                      }}
                    />
                    <div
                      style={{
                        width: "35%",
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
                    href={`/service/${s.slug}`}
                    className="animate-fade-in"
                    style={{
                      animationDelay: `${i * 0.04}s`,
                      animationFillMode: "both",
                      background: t.surface,
                      border: `1px solid ${isOp ? t.border : "rgba(239,68,68,0.25)"}`,
                      borderRadius: 10,
                      padding: "14px 16px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      transition: "all 0.2s ease",
                      textDecoration: "none",
                      color: "inherit",
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
                    <LogoIcon
                      name={s.name}
                      logoUrl={s.logoUrl}
                      size={32}
                      t={t}
                    />
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
                      <div
                        style={{
                          fontSize: 11,
                          color: t.textMuted,
                          marginTop: 2,
                        }}
                      >
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

      {/* ═══════════════════════════════════════════════════════
          SECTION 3 — SOCIAL PROOF + INLINE AUTH
          ═══════════════════════════════════════════════════════ */}
      <section
        ref={proofReveal.ref}
        style={{
          maxWidth: 640,
          margin: "0 auto",
          padding: "0 24px 80px",
          textAlign: "center",
          ...proofReveal.style,
        }}
      >
        <div
          style={{
            background: t.surface,
            border: `1px solid ${t.border}`,
            borderRadius: 16,
            padding: "48px 32px",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Top accent line */}
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
              fontSize: 24,
              fontWeight: 700,
              letterSpacing: -0.5,
              lineHeight: 1.3,
              margin: "0 0 8px 0",
            }}
          >
            69,000+ checks.{" "}
            <span style={{ color: t.accentPrimary }}>Every day.</span>
          </h2>
          <p
            style={{
              fontSize: 14,
              color: t.textMuted,
              lineHeight: 1.6,
              marginBottom: 20,
            }}
          >
            {totalCount} services across {categoryCount || 14} categories,
            polled every 60 seconds. Your entire stack, always watched.
          </p>

          {/* Inline value props — condensed from removed Section 3 */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: "6px 18px",
              marginBottom: 24,
              fontSize: 13,
              color: t.textSecondary,
            }}
          >
            {["Instant alerts", "Project boards", "Incident timelines", "Team sharing"].map((v) => (
              <span key={v} style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={t.accentGreen} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                {v}
              </span>
            ))}
          </div>

          {/* Logo ribbon */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              flexWrap: "wrap",
              opacity: 0.5,
              marginBottom: 28,
            }}
          >
            {[
              "GitHub",
              "AWS",
              "Vercel",
              "Stripe",
              "Cloudflare",
              "OpenAI",
              "Supabase",
            ].map((name) => (
              <LogoIcon
                key={name}
                name={name}
                logoUrl={logoMap[name.toLowerCase()]}
                size={24}
                t={t}
              />
            ))}
          </div>

          {/* Inline auth */}
          {isSupabaseEnabled && !user ? (
            <div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  maxWidth: 320,
                  margin: "0 auto",
                }}
              >
                <button
                  onClick={signInWithGoogle}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 10,
                    padding: "11px 20px",
                    borderRadius: 10,
                    border: `1px solid ${t.border}`,
                    background: t.bg,
                    color: t.text,
                    fontSize: 14,
                    fontWeight: 600,
                    fontFamily: "var(--font-sans)",
                    cursor: "pointer",
                    transition: "all 0.15s",
                    width: "100%",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = t.borderHover;
                    e.currentTarget.style.background = t.surfaceHover;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = t.border;
                    e.currentTarget.style.background = t.bg;
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Continue with Google
                </button>
                <button
                  onClick={signInWithGitHub}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 10,
                    padding: "11px 20px",
                    borderRadius: 10,
                    border: `1px solid ${t.border}`,
                    background: t.bg,
                    color: t.text,
                    fontSize: 14,
                    fontWeight: 600,
                    fontFamily: "var(--font-sans)",
                    cursor: "pointer",
                    transition: "all 0.15s",
                    width: "100%",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = t.borderHover;
                    e.currentTarget.style.background = t.surfaceHover;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = t.border;
                    e.currentTarget.style.background = t.bg;
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill={t.text}>
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                  Continue with GitHub
                </button>
              </div>
              <p
                style={{
                  fontSize: 11,
                  color: t.textMuted,
                  marginTop: 14,
                  opacity: 0.6,
                  fontFamily: "var(--font-mono)",
                }}
              >
                One click · 14-day Pro trial · No credit card
              </p>
            </div>
          ) : (
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
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          SECTION 5 — FOOTER
          ═══════════════════════════════════════════════════════ */}
      <AppFooter t={t}>
        {["aws", "github", "vercel", "openai", "stripe", "cloudflare", "slack", "datadog"].map((slug) => {
          const svc = serviceConfigs.find((s) => s.slug === slug);
          if (!svc) return null;
          return (
            <Link
              key={slug}
              href={`/service/${slug}`}
              style={{ fontSize: 11, color: t.footerColor, fontFamily: "var(--font-mono)", textDecoration: "none", opacity: 0.8 }}
            >
              {svc.name}
            </Link>
          );
        })}
      </AppFooter>

      {/* Sign In Modal */}
      {showSignIn && (
        <SignInModal t={t} onClose={() => setShowSignIn(false)} />
      )}

      {/* Exit Intent Popup — recovers bouncing visitors */}
      {showExitIntent && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(4px)",
            animation: "fade-in 0.2s ease",
          }}
          onClick={dismissExitIntent}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: t.surface,
              border: `1px solid ${t.border}`,
              borderRadius: 16,
              padding: "36px 32px",
              maxWidth: 400,
              width: "90%",
              textAlign: "center",
              position: "relative",
              boxShadow: `0 24px 48px rgba(0,0,0,0.3)`,
              animation: "scale-in 0.2s ease",
            }}
          >
            <button
              onClick={dismissExitIntent}
              style={{
                position: "absolute",
                top: 12,
                right: 12,
                background: "none",
                border: "none",
                color: t.textMuted,
                cursor: "pointer",
                padding: 4,
                fontSize: 18,
                lineHeight: 1,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: `${t.accentPrimary}12`,
                border: `1px solid ${t.accentPrimary}20`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={t.accentPrimary} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </div>
            <h3
              style={{
                fontSize: 20,
                fontWeight: 700,
                letterSpacing: -0.5,
                margin: "0 0 8px",
                color: t.text,
              }}
            >
              Don&apos;t miss the next outage
            </h3>
            <p
              style={{
                fontSize: 14,
                color: t.textMuted,
                lineHeight: 1.6,
                margin: "0 0 24px",
              }}
            >
              Get notified the moment AWS, GitHub, or any of your services go down. Free alerts, no noise.
            </p>
            <button
              onClick={() => {
                dismissExitIntent();
                setShowSignIn(true);
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background: t.accentPrimary,
                color: "#fff",
                border: "none",
                borderRadius: 10,
                padding: "12px 28px",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "var(--font-sans)",
                transition: "all 0.2s ease",
                boxShadow: `0 0 20px ${t.accentPrimary}30`,
                width: "100%",
                justifyContent: "center",
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
              Get Free Alerts
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
            <p
              style={{
                fontSize: 11,
                color: t.textMuted,
                marginTop: 12,
                opacity: 0.6,
                fontFamily: "var(--font-mono)",
              }}
            >
              14-day Pro trial · No credit card
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
