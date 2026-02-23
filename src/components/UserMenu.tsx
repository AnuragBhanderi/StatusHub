"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useUser } from "@/lib/user-context";
import type { Theme, ThemeKey } from "@/config/themes";
import { THEMES } from "@/config/themes";
import NotificationSettings from "@/components/NotificationSettings";

interface UserMenuProps {
  t: Theme;
}

const THEME_ICONS: Record<string, { label: string; icon: (color: string) => React.ReactNode }> = {
  dark: {
    label: "Dark",
    icon: (color) => (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>
    ),
  },
  light: {
    label: "Light",
    icon: (color) => (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="5" />
        <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
        <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
      </svg>
    ),
  },
  midnight: {
    label: "Midnight",
    icon: (color) => (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
  },
};

export default function UserMenu({ t }: UserMenuProps) {
  const { user, signOut, plan, preferences: { theme }, setTheme, notificationPrefs, saveNotificationPrefs, setShowUpgradeModal } = useUser();
  const [open, setOpen] = useState(false);
  const [showNotifSettings, setShowNotifSettings] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (!user) return null;

  const avatarUrl = user.user_metadata?.avatar_url;
  const name =
    user.user_metadata?.full_name || user.email || "User";
  const email = user.email || "";

  return (
    <>
      <div ref={ref} style={{ position: "relative" }}>
        <button
          onClick={() => setOpen(!open)}
          aria-label="User menu"
          style={{
            width: 30,
            height: 30,
            borderRadius: "50%",
            border: `1px solid ${t.border}`,
            cursor: "pointer",
            overflow: "hidden",
            background: t.surface,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 0,
            transition: "border-color 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = t.borderHover)}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = t.border)}
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt=""
              width={30}
              height={30}
              style={{ objectFit: "cover" }}
            />
          ) : (
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: t.textMuted,
                fontFamily: "var(--font-sans)",
              }}
            >
              {name.charAt(0).toUpperCase()}
            </span>
          )}
        </button>

        {open && (
          <div
            className="animate-scale-in"
            style={{
              position: "absolute",
              top: "calc(100% + 8px)",
              right: 0,
              minWidth: 230,
              background: t.surface,
              border: `1px solid ${t.border}`,
              borderRadius: 10,
              boxShadow: t.shadowLg,
              padding: 6,
              zIndex: 200,
            }}
          >
            {/* User info */}
            <div
              style={{
                padding: "8px 10px",
                borderBottom: `1px solid ${t.divider}`,
                marginBottom: 4,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: t.text,
                    fontFamily: "var(--font-sans)",
                  }}
                >
                  {name}
                </span>
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    color: plan === "pro" ? t.accentPrimary : t.textMuted,
                    background: plan === "pro" ? `${t.accentPrimary}15` : t.tagBg,
                    border: `1px solid ${plan === "pro" ? `${t.accentPrimary}30` : t.border}`,
                    padding: "1px 6px",
                    borderRadius: 4,
                    fontFamily: "var(--font-mono)",
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}
                >
                  {plan === "pro" ? "Pro" : "Free"}
                </span>
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: t.textMuted,
                  marginTop: 2,
                  fontFamily: "var(--font-sans)",
                }}
              >
                {email}
              </div>
            </div>

            {/* Theme switcher row */}
            <div style={{
              padding: "6px 10px 8px",
              borderBottom: `1px solid ${t.divider}`,
              marginBottom: 4,
            }}>
              <div style={{
                fontSize: 10,
                fontWeight: 600,
                color: t.textMuted,
                fontFamily: "var(--font-mono)",
                textTransform: "uppercase",
                letterSpacing: 0.5,
                marginBottom: 6,
              }}>
                Theme
              </div>
              <div style={{ display: "flex", gap: 4 }}>
                {(Object.keys(THEMES) as ThemeKey[]).map((k) => {
                  const isActive = theme === k;
                  const iconDef = THEME_ICONS[k];
                  return (
                    <button
                      key={k}
                      onClick={() => setTheme(k)}
                      title={iconDef?.label || k}
                      style={{
                        flex: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 5,
                        padding: "6px 0",
                        borderRadius: 6,
                        border: `1px solid ${isActive ? `${t.accentPrimary}40` : t.border}`,
                        background: isActive ? `${t.accentPrimary}12` : "transparent",
                        cursor: "pointer",
                        transition: "all 0.15s",
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) e.currentTarget.style.background = t.surfaceHover;
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) e.currentTarget.style.background = "transparent";
                      }}
                    >
                      {iconDef?.icon(isActive ? t.accentPrimary : t.textMuted)}
                      <span style={{
                        fontSize: 11,
                        fontWeight: isActive ? 600 : 400,
                        color: isActive ? t.accentPrimary : t.textMuted,
                        fontFamily: "var(--font-sans)",
                      }}>
                        {iconDef?.label || k}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              onClick={() => {
                setOpen(false);
                setShowNotifSettings(true);
              }}
              style={{
                width: "100%",
                padding: "8px 10px",
                border: "none",
                borderRadius: 6,
                cursor: "pointer",
                background: "transparent",
                color: t.textSecondary,
                fontSize: 13,
                fontWeight: 500,
                fontFamily: "var(--font-sans)",
                textAlign: "left" as const,
                transition: "background 0.15s",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = t.surfaceHover)
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
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
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              Notification Settings
            </button>
            {plan === "free" && (
              <button
                onClick={() => {
                  setOpen(false);
                  setShowUpgradeModal(true);
                }}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  border: "none",
                  borderRadius: 6,
                  cursor: "pointer",
                  background: "transparent",
                  color: t.accentPrimary,
                  fontSize: 13,
                  fontWeight: 600,
                  fontFamily: "var(--font-sans)",
                  textAlign: "left" as const,
                  transition: "background 0.15s",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = t.surfaceHover)
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
                </svg>
                Upgrade to Pro
              </button>
            )}
            <button
              onClick={async () => {
                await signOut();
                setOpen(false);
              }}
              style={{
                width: "100%",
                padding: "8px 10px",
                border: "none",
                borderRadius: 6,
                cursor: "pointer",
                background: "transparent",
                color: t.textSecondary,
                fontSize: 13,
                fontWeight: 500,
                fontFamily: "var(--font-sans)",
                textAlign: "left" as const,
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = t.surfaceHover)
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              Sign out
            </button>
          </div>
        )}
      </div>

      {showNotifSettings &&
        createPortal(
          <NotificationSettings
            t={t}
            pushEnabled={notificationPrefs.pushEnabled}
            emailEnabled={notificationPrefs.emailEnabled}
            emailAddress={notificationPrefs.emailAddress}
            severityThreshold={notificationPrefs.severityThreshold}
            userEmail={email}
            onSave={(prefs) => {
              saveNotificationPrefs(prefs);
              setShowNotifSettings(false);
            }}
            onClose={() => setShowNotifSettings(false)}
          />,
          document.body
        )}
    </>
  );
}
