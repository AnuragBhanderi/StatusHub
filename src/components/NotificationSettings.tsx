"use client";

import { useState } from "react";
import type { Theme } from "@/config/themes";

interface NotificationSettingsProps {
  t: Theme;
  pushEnabled: boolean;
  emailEnabled: boolean;
  emailAddress: string;
  severityThreshold: string;
  userEmail: string;
  onSave: (prefs: {
    push_enabled: boolean;
    email_enabled: boolean;
    email_address: string;
    severity_threshold: string;
  }) => void;
  onClose: () => void;
}

export default function NotificationSettings({
  t,
  pushEnabled,
  emailEnabled,
  emailAddress,
  severityThreshold,
  userEmail,
  onSave,
  onClose,
}: NotificationSettingsProps) {
  const [push, setPush] = useState(pushEnabled);
  const [email, setEmail] = useState(emailEnabled);
  const [addr, setAddr] = useState(emailAddress || userEmail || "");
  const [threshold, setThreshold] = useState(severityThreshold || "all");
  const [testStatus, setTestStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [saving, setSaving] = useState(false);

  const pushPermission =
    typeof window !== "undefined" && "Notification" in window
      ? Notification.permission
      : "default";

  const handleSave = async () => {
    setSaving(true);
    onSave({
      push_enabled: push,
      email_enabled: email,
      email_address: addr,
      severity_threshold: threshold,
    });
    setSaving(false);
  };

  const handleTestEmail = async () => {
    setTestStatus("sending");
    try {
      const res = await fetch("/api/notifications/test-email", { method: "POST" });
      if (res.ok) {
        setTestStatus("sent");
      } else {
        setTestStatus("error");
      }
    } catch {
      setTestStatus("error");
    }
    setTimeout(() => setTestStatus("idle"), 4000);
  };

  const handleRequestPermission = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    const result = await Notification.requestPermission();
    if (result === "granted") {
      setPush(true);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 300,
        padding: 16,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: t.surface,
          border: `1px solid ${t.border}`,
          borderRadius: 16,
          maxWidth: 440,
          width: "100%",
          boxShadow: t.cardShadow,
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px",
            borderBottom: `1px solid ${t.divider}`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke={t.accentPrimary}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <span style={{ fontSize: 15, fontWeight: 600, color: t.text }}>
              Notification Settings
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: 4,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke={t.textMuted}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "20px" }}>
          {/* Push Notifications Section */}
          <div style={{ marginBottom: 24 }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: t.textSecondary,
                fontFamily: "var(--font-mono)",
                letterSpacing: 0.5,
                textTransform: "uppercase",
                marginBottom: 12,
              }}
            >
              Push Notifications
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 14px",
                background: t.bg,
                borderRadius: 10,
                border: `1px solid ${t.border}`,
              }}
            >
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: t.text }}>
                  Browser notifications
                </div>
                <div style={{ fontSize: 11, color: t.textMuted, marginTop: 2 }}>
                  {pushPermission === "denied"
                    ? "Blocked by browser — enable in browser settings"
                    : pushPermission === "granted"
                    ? "Get notified when My Stack services change"
                    : "Click to request permission"}
                </div>
              </div>

              {pushPermission === "default" ? (
                <button
                  onClick={handleRequestPermission}
                  style={{
                    background: t.accentPrimary,
                    color: "#fff",
                    border: "none",
                    borderRadius: 6,
                    padding: "6px 12px",
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: "pointer",
                    flexShrink: 0,
                  }}
                >
                  Enable
                </button>
              ) : (
                <ToggleSwitch
                  enabled={push}
                  onChange={setPush}
                  disabled={pushPermission === "denied"}
                  t={t}
                />
              )}
            </div>
          </div>

          {/* Email Notifications Section */}
          <div style={{ marginBottom: 20 }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: t.textSecondary,
                fontFamily: "var(--font-mono)",
                letterSpacing: 0.5,
                textTransform: "uppercase",
                marginBottom: 12,
              }}
            >
              Email Alerts
            </div>

            <div
              style={{
                padding: "14px",
                background: t.bg,
                borderRadius: 10,
                border: `1px solid ${t.border}`,
                display: "flex",
                flexDirection: "column",
                gap: 14,
              }}
            >
              {/* Email toggle */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: t.text }}>
                    Email notifications
                  </div>
                  <div style={{ fontSize: 11, color: t.textMuted, marginTop: 2 }}>
                    Receive alerts even when the tab is closed
                  </div>
                </div>
                <ToggleSwitch enabled={email} onChange={setEmail} t={t} />
              </div>

              {/* Email address */}
              {email && (
                <>
                  <div>
                    <label
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: t.textMuted,
                        display: "block",
                        marginBottom: 6,
                      }}
                    >
                      Email address
                    </label>
                    <input
                      type="email"
                      value={addr}
                      onChange={(e) => setAddr(e.target.value)}
                      placeholder="you@example.com"
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        borderRadius: 8,
                        border: `1px solid ${t.border}`,
                        background: t.searchBg,
                        color: t.text,
                        fontSize: 13,
                        fontFamily: "var(--font-sans)",
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>

                  {/* Severity threshold */}
                  <div>
                    <label
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: t.textMuted,
                        display: "block",
                        marginBottom: 6,
                      }}
                    >
                      Alert threshold
                    </label>
                    <select
                      value={threshold}
                      onChange={(e) => setThreshold(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        borderRadius: 8,
                        border: `1px solid ${t.border}`,
                        background: t.searchBg,
                        color: t.text,
                        fontSize: 13,
                        fontFamily: "var(--font-sans)",
                        outline: "none",
                        cursor: "pointer",
                        boxSizing: "border-box",
                      }}
                    >
                      <option value="all">All status changes</option>
                      <option value="outages_only">Outages only</option>
                      <option value="major_only">Major outages only</option>
                    </select>
                  </div>

                  {/* Test email button */}
                  <button
                    onClick={handleTestEmail}
                    disabled={testStatus === "sending" || !addr}
                    style={{
                      alignSelf: "flex-start",
                      background: "transparent",
                      border: `1px solid ${t.border}`,
                      borderRadius: 8,
                      padding: "7px 14px",
                      fontSize: 12,
                      fontWeight: 500,
                      color: t.textSecondary,
                      cursor: testStatus === "sending" ? "wait" : "pointer",
                      fontFamily: "var(--font-sans)",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      opacity: !addr ? 0.5 : 1,
                    }}
                  >
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                    {testStatus === "sending"
                      ? "Sending..."
                      : testStatus === "sent"
                      ? "Sent! Check inbox"
                      : testStatus === "error"
                      ? "Failed — check SMTP config"
                      : "Send test email"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 8,
            padding: "12px 20px",
            borderTop: `1px solid ${t.divider}`,
          }}
        >
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: `1px solid ${t.border}`,
              borderRadius: 8,
              padding: "8px 18px",
              fontSize: 13,
              fontWeight: 500,
              color: t.textSecondary,
              cursor: "pointer",
              fontFamily: "var(--font-sans)",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              background: t.accentPrimary,
              border: "none",
              borderRadius: 8,
              padding: "8px 18px",
              fontSize: 13,
              fontWeight: 600,
              color: "#fff",
              cursor: "pointer",
              fontFamily: "var(--font-sans)",
            }}
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ToggleSwitch({
  enabled,
  onChange,
  disabled,
  t,
}: {
  enabled: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  t: Theme;
}) {
  return (
    <button
      role="switch"
      aria-checked={enabled}
      onClick={() => !disabled && onChange(!enabled)}
      style={{
        width: 40,
        height: 22,
        borderRadius: 11,
        border: "none",
        background: enabled ? t.accentGreen : t.border,
        cursor: disabled ? "not-allowed" : "pointer",
        position: "relative",
        transition: "background 0.2s",
        opacity: disabled ? 0.5 : 1,
        flexShrink: 0,
        padding: 0,
      }}
    >
      <span
        style={{
          position: "absolute",
          top: 2,
          left: enabled ? 20 : 2,
          width: 18,
          height: 18,
          borderRadius: "50%",
          background: "#fff",
          transition: "left 0.2s",
          boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
        }}
      />
    </button>
  );
}
