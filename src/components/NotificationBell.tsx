"use client";

import type { Theme } from "@/config/themes";

interface NotificationBellProps {
  pushEnabled: boolean;
  onToggle: () => void;
  t: Theme;
}

export default function NotificationBell({ pushEnabled, onToggle, t }: NotificationBellProps) {
  const permission = typeof window !== "undefined" && "Notification" in window
    ? Notification.permission
    : "default";

  const isDenied = permission === "denied";

  const handleClick = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) return;

    if (Notification.permission === "default") {
      const result = await Notification.requestPermission();
      if (result === "granted") {
        onToggle();
      }
      return;
    }

    if (Notification.permission === "granted") {
      onToggle();
    }
  };

  return (
    <button
      onClick={handleClick}
      title={
        isDenied
          ? "Notifications blocked by browser"
          : pushEnabled
          ? "Disable push notifications"
          : "Enable push notifications"
      }
      style={{
        position: "relative",
        width: 30,
        height: 30,
        borderRadius: 8,
        border: `1px solid ${t.border}`,
        background: "transparent",
        cursor: isDenied ? "not-allowed" : "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        opacity: isDenied ? 0.4 : 1,
        transition: "all 0.15s",
        flexShrink: 0,
      }}
      onMouseEnter={(e) => {
        if (!isDenied) e.currentTarget.style.borderColor = t.borderHover;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = t.border;
      }}
    >
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke={pushEnabled ? t.accentPrimary : t.textMuted}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>

      {/* Enabled indicator dot */}
      {pushEnabled && !isDenied && (
        <span
          style={{
            position: "absolute",
            top: 4,
            right: 4,
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: t.accentGreen,
            boxShadow: `0 0 4px ${t.accentGreen}60`,
          }}
        />
      )}

      {/* Denied strikethrough */}
      {isDenied && (
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          style={{ position: "absolute" }}
        >
          <line
            x1="4"
            y1="4"
            x2="20"
            y2="20"
            stroke={t.textMuted}
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      )}
    </button>
  );
}
