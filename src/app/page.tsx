"use client";

import { useState, useEffect, useMemo, useRef } from "react";
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

  useEffect(() => {
    setHasMounted(true);
    fetch("/api/services")
      .then((res) => res.json())
      .then((data) => {
        if (data.services) {
          const all: PreviewService[] = data.services;
          setTotalCount(all.length);
          setCategoryCount(new Set(all.map((s) => s.category)).size);
          // Curated list of recognizable services developers care about
          const curated = [
            "github", "aws", "vercel", "stripe",
            "openai", "cloudflare", "slack", "datadog",
          ];
          const curatedSet = new Set(curated);
          // Pick curated ones first (in order), then fill with any non-operational
          const picked: PreviewService[] = [];
          const bySlug = new Map(all.map((s) => [s.slug, s]));
          for (const slug of curated) {
            const s = bySlug.get(slug);
            if (s) picked.push(s);
          }
          // If any service has an issue and isn't already picked, prepend it
          for (const s of all) {
            if (s.currentStatus !== "OPERATIONAL" && !curatedSet.has(s.slug)) {
              picked.unshift(s);
            }
          }
          setServices(picked.slice(0, 8));
        }
      })
      .catch(() => {})
      .finally(() => {
        setServicesLoading(false);
      });
  }, []);

  const valuePropsReveal = useReveal();
  const proofReveal = useReveal();

  if (!hasMounted) {
    return <div style={{ minHeight: "100vh", background: "transparent" }} />;
  }

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
          {/* Status pill — static first, then live */}
          <div
            className="animate-fade-in"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: servicesLoading
                ? `${t.textMuted}08`
                : `${t.accentGreen}12`,
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
              <>
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: t.textMuted,
                    opacity: 0.5,
                  }}
                />
                {totalCount} services monitored
              </>
            ) : (
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
                {services.filter((s) => s.currentStatus === "OPERATIONAL").length}/
                {totalCount} services operational
              </>
            )}
          </div>

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
            AWS, GitHub, Vercel, Stripe, OpenAI and{" "}
            {totalCount > 5 ? totalCount - 5 : "40+"} more services.
            Real-time status, instant alerts, one dashboard. Free.
          </p>

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
              <>
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
                  Get Started Free
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
                <Link
                  href="/dashboard"
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
                    textDecoration: "none",
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
                  View Dashboard
                </Link>
              </>
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
            View all {totalCount} services
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
          SECTION 3 — VALUE PROPS
          ═══════════════════════════════════════════════════════ */}
      <section
        ref={valuePropsReveal.ref}
        style={{
          maxWidth: 1000,
          margin: "0 auto",
          padding: "0 24px 80px",
          ...valuePropsReveal.style,
        }}
      >
        <div
          className="sh-value-cards"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 12,
          }}
        >
          {[
            {
              title: `${totalCount}+ Services`,
              desc: "AWS, GitHub, Vercel, Stripe, OpenAI and more. Polled every 60 seconds from official APIs.",
              icon: (
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={t.accentPrimary}
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="3" width="7" height="7" rx="1" />
                  <rect x="3" y="14" width="7" height="7" rx="1" />
                  <rect x="14" y="14" width="7" height="7" rx="1" />
                </svg>
              ),
            },
            {
              title: "Instant Alerts",
              desc: "Email and push notifications when your services go down. Know before your users do.",
              icon: (
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={t.accentPrimary}
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
              ),
            },
            {
              title: "Project Boards",
              desc: "Star the services your team depends on. Organize into projects. Share with a link.",
              icon: (
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={t.accentPrimary}
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              ),
            },
            {
              title: "Incident Timelines",
              desc: "Full update history from investigating to resolved. Track outage duration at a glance.",
              icon: (
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={t.accentPrimary}
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              ),
            },
          ].map((card, i) => (
            <div
              key={card.title}
              style={{
                padding: "28px 22px",
                borderRadius: 12,
                background: t.surface,
                border: `1px solid ${t.border}`,
                transition: "all 0.25s ease",
                transitionDelay: `${i * 0.05}s`,
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
                  width: 42,
                  height: 42,
                  borderRadius: 11,
                  background: `${t.accentPrimary}10`,
                  border: `1px solid ${t.accentPrimary}18`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 16,
                }}
              >
                {card.icon}
              </div>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 600,
                  color: t.text,
                  marginBottom: 8,
                }}
              >
                {card.title}
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: t.textMuted,
                  lineHeight: 1.6,
                }}
              >
                {card.desc}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          SECTION 4 — SOCIAL PROOF + INLINE AUTH
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
            Join developers monitoring their stack
          </h2>
          <p
            style={{
              fontSize: 14,
              color: t.textMuted,
              lineHeight: 1.6,
              marginBottom: 8,
            }}
          >
            {totalCount} services tracked across {categoryCount || 14}{" "}
            categories. Real-time updates every 60 seconds.
          </p>

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
              marginTop: 20,
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

          {/* Inline auth or dashboard link */}
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
              <Link
                href="/dashboard"
                style={{
                  display: "inline-block",
                  marginTop: 16,
                  fontSize: 13,
                  color: t.textMuted,
                  textDecoration: "none",
                  transition: "color 0.15s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.color = t.textSecondary)
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = t.textMuted)
                }
              >
                or continue without signing up
              </Link>
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
      <AppFooter t={t} />

      {/* Sign In Modal */}
      {showSignIn && (
        <SignInModal t={t} onClose={() => setShowSignIn(false)} />
      )}
    </div>
  );
}
