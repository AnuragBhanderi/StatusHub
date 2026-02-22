"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useUser } from "@/lib/user-context";
import type { Theme } from "@/config/themes";
import NotificationSettings from "@/components/NotificationSettings";

interface UserMenuProps {
  t: Theme;
}

export default function UserMenu({ t }: UserMenuProps) {
  const { user, signOut, notificationPrefs, saveNotificationPrefs } = useUser();
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
              minWidth: 220,
              background: t.surface,
              border: `1px solid ${t.border}`,
              borderRadius: 10,
              boxShadow: t.shadowLg,
              padding: 6,
              zIndex: 200,
            }}
          >
            <div
              style={{
                padding: "8px 10px",
                borderBottom: `1px solid ${t.divider}`,
                marginBottom: 4,
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: t.text,
                  fontFamily: "var(--font-sans)",
                }}
              >
                {name}
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
