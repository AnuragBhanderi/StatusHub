"use client";

import { useState, useMemo } from "react";
import type { Theme } from "@/config/themes";
import { useToast } from "@/components/Toast";

const ALL_EVENTS = [
  { key: "major_outage", label: "Major Outage", short: "Major", color: "#ef4444", group: "status" },
  { key: "partial_outage", label: "Partial Outage", short: "Partial", color: "#ea580c", group: "status" },
  { key: "degraded", label: "Degraded", short: "Degraded", color: "#ca8a04", group: "status" },
  { key: "maintenance", label: "Maintenance", short: "Maint.", color: "#448aff", group: "status" },
  { key: "recovery", label: "Recovery", short: "Recovery", color: "#16a34a", group: "status" },
  { key: "maintenance_completed", label: "Maint. Done", short: "Maint. Done", color: "#22c55e", group: "status" },
  { key: "new_incident", label: "New Incident", short: "New", color: "#ef4444", group: "incident" },
  { key: "incident_update", label: "Inc. Update", short: "Update", color: "#f59e0b", group: "incident" },
  { key: "incident_resolved", label: "Inc. Resolved", short: "Resolved", color: "#16a34a", group: "incident" },
  { key: "incident_escalated", label: "Escalated", short: "Escalated", color: "#ef4444", group: "incident" },
  { key: "incident_de_escalated", label: "De-escalated", short: "De-escalated", color: "#22c55e", group: "incident" },
] as const;

const ALL_KEYS = new Set(ALL_EVENTS.map((e) => e.key));

const PRESETS = [
  {
    id: "all",
    label: "All Events",
    desc: "Everything — outages, incidents, maintenance, recoveries",
    keys: new Set(ALL_EVENTS.map((e) => e.key)),
  },
  {
    id: "outages",
    label: "Outages & Incidents",
    desc: "Outages, incidents, and recoveries — skip maintenance & minor updates",
    keys: new Set([
      "partial_outage", "major_outage", "recovery",
      "new_incident", "incident_resolved", "incident_escalated", "incident_de_escalated",
    ]),
  },
  {
    id: "critical",
    label: "Critical Only",
    desc: "Only major outages, escalations, and resolutions",
    keys: new Set(["major_outage", "recovery", "incident_escalated", "incident_resolved"]),
  },
] as const;

function parseThreshold(threshold: string): Set<string> {
  switch (threshold) {
    case "all":
      return new Set(ALL_EVENTS.map((e) => e.key));
    case "outages_only":
      return new Set([
        "partial_outage", "major_outage", "recovery",
        "new_incident", "incident_resolved", "incident_escalated", "incident_de_escalated",
      ]);
    case "major_only":
      return new Set(["major_outage", "recovery", "incident_escalated", "incident_resolved"]);
    default:
      return new Set(threshold.split(",").filter(Boolean));
  }
}

function setsEqual(a: Set<string>, b: Set<string>): boolean {
  if (a.size !== b.size) return false;
  for (const v of a) if (!b.has(v)) return false;
  return true;
}

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
  const [enabledEvents, setEnabledEvents] = useState<Set<string>>(
    () => parseThreshold(severityThreshold || "all")
  );
  const [customOpen, setCustomOpen] = useState(false);
  const [testStatus, setTestStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  const activePreset = useMemo(
    () => PRESETS.find((p) => setsEqual(p.keys, enabledEvents))?.id ?? null,
    [enabledEvents]
  );

  const toggleEvent = (key: string) => {
    setEnabledEvents((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const applyPreset = (keys: Set<string>) => {
    setEnabledEvents(new Set(keys));
  };

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
      severity_threshold: Array.from(enabledEvents).join(","),
    });
    setSaving(false);
    showToast("Notification settings saved", "success");
  };

  const handleTestEmail = async () => {
    setTestStatus("sending");
    try {
      const res = await fetch("/api/notifications/test-email", { method: "POST" });
      if (res.ok) setTestStatus("sent");
      else setTestStatus("error");
    } catch {
      setTestStatus("error");
    }
    setTimeout(() => setTestStatus("idle"), 4000);
  };

  const handleRequestPermission = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    const result = await Notification.requestPermission();
    if (result === "granted") setPush(true);
  };

  const statusEvents = ALL_EVENTS.filter((e) => e.group === "status");
  const incidentEvents = ALL_EVENTS.filter((e) => e.group === "incident");

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
        padding: 24,
        overflowY: "auto",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="animate-scale-in"
        style={{
          background: t.surface,
          border: `1px solid ${t.border}`,
          borderRadius: 12,
          maxWidth: 440,
          width: "100%",
          maxHeight: "calc(100vh - 48px)",
          overflowY: "auto",
          boxShadow: t.shadowLg,
          margin: "auto",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 18px",
            borderBottom: `1px solid ${t.divider}`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={t.accentPrimary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <span style={{ fontSize: 14, fontWeight: 600, color: t.text }}>
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
              borderRadius: 4,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={t.textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "18px" }}>
          {/* Push Notifications */}
          <div style={{ marginBottom: 20 }}>
            <SectionLabel t={t}>Push Notifications</SectionLabel>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 14px",
                background: t.bg,
                borderRadius: 8,
                border: `1px solid ${t.border}`,
              }}
            >
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: t.text }}>
                  Browser notifications
                </div>
                <div style={{ fontSize: 11, color: t.textMuted, marginTop: 2 }}>
                  {pushPermission === "denied"
                    ? "Blocked by browser — enable in settings"
                    : pushPermission === "granted"
                    ? "Get notified when services change"
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
                    padding: "5px 12px",
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: "pointer",
                    flexShrink: 0,
                  }}
                >
                  Enable
                </button>
              ) : (
                <ToggleSwitch enabled={push} onChange={setPush} disabled={pushPermission === "denied"} t={t} />
              )}
            </div>
          </div>

          {/* Email Alerts */}
          <div>
            <SectionLabel t={t}>Email Alerts</SectionLabel>
            <div
              style={{
                padding: "14px",
                background: t.bg,
                borderRadius: 8,
                border: `1px solid ${t.border}`,
                display: "flex",
                flexDirection: "column",
                gap: 14,
              }}
            >
              {/* Email toggle */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: t.text }}>Email notifications</div>
                  <div style={{ fontSize: 11, color: t.textMuted, marginTop: 2 }}>
                    Receive alerts even when the tab is closed
                  </div>
                </div>
                <ToggleSwitch enabled={email} onChange={setEmail} t={t} />
              </div>

              {email && (
                <>
                  {/* Email address (read-only) */}
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: t.textMuted, display: "block", marginBottom: 6 }}>
                      Email address
                    </label>
                    <div
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        borderRadius: 6,
                        border: `1px solid ${t.border}`,
                        background: t.bg,
                        color: t.textSecondary,
                        fontSize: 13,
                        fontFamily: "var(--font-sans)",
                        boxSizing: "border-box",
                        opacity: 0.7,
                      }}
                    >
                      {addr || "No email on file"}
                    </div>
                  </div>

                  {/* Preset picker */}
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: t.textMuted, display: "block", marginBottom: 8 }}>
                      Notify me about
                    </label>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {PRESETS.map((preset) => {
                        const active = activePreset === preset.id;
                        return (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => applyPreset(preset.keys)}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 10,
                              padding: "10px 12px",
                              borderRadius: 8,
                              border: `1.5px solid ${active ? t.accentPrimary + "60" : t.border}`,
                              background: active ? t.accentPrimary + "0a" : "transparent",
                              cursor: "pointer",
                              transition: "all 0.15s",
                              textAlign: "left",
                            }}
                          >
                            {/* Radio dot */}
                            <div
                              style={{
                                width: 16,
                                height: 16,
                                borderRadius: "50%",
                                border: `2px solid ${active ? t.accentPrimary : t.textFaint}`,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                                transition: "all 0.15s",
                              }}
                            >
                              {active && (
                                <div
                                  style={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: "50%",
                                    background: t.accentPrimary,
                                  }}
                                />
                              )}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 12, fontWeight: 600, color: t.text }}>{preset.label}</div>
                              <div style={{ fontSize: 11, color: t.textMuted, marginTop: 1 }}>{preset.desc}</div>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Custom toggle */}
                    <button
                      type="button"
                      onClick={() => setCustomOpen(!customOpen)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        marginTop: 10,
                        padding: 0,
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        fontSize: 11,
                        fontWeight: 600,
                        color: t.accentSecondary,
                        fontFamily: "var(--font-sans)",
                      }}
                    >
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{
                          transform: customOpen ? "rotate(90deg)" : "rotate(0deg)",
                          transition: "transform 0.2s",
                        }}
                      >
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                      Customize individually
                      {!activePreset && (
                        <span
                          style={{
                            fontSize: 9,
                            fontWeight: 700,
                            background: t.accentPrimary + "18",
                            color: t.accentPrimary,
                            padding: "1px 6px",
                            borderRadius: 3,
                            fontFamily: "var(--font-mono)",
                          }}
                        >
                          CUSTOM
                        </span>
                      )}
                    </button>

                    {/* Collapsible custom section */}
                    {customOpen && (
                      <div style={{ marginTop: 10 }}>
                        {/* Status events */}
                        <div style={{ marginBottom: 10 }}>
                          <div style={{
                            fontSize: 10,
                            fontWeight: 700,
                            color: t.textMuted,
                            fontFamily: "var(--font-mono)",
                            letterSpacing: 0.5,
                            textTransform: "uppercase",
                            marginBottom: 6,
                          }}>
                            Service Status
                          </div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                            {statusEvents.map((evt) => (
                              <ChipToggle key={evt.key} evt={evt} checked={enabledEvents.has(evt.key)} onToggle={toggleEvent} t={t} />
                            ))}
                          </div>
                        </div>

                        {/* Incident events */}
                        <div>
                          <div style={{
                            fontSize: 10,
                            fontWeight: 700,
                            color: t.textMuted,
                            fontFamily: "var(--font-mono)",
                            letterSpacing: 0.5,
                            textTransform: "uppercase",
                            marginBottom: 6,
                          }}>
                            Incidents
                          </div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                            {incidentEvents.map((evt) => (
                              <ChipToggle key={evt.key} evt={evt} checked={enabledEvents.has(evt.key)} onToggle={toggleEvent} t={t} />
                            ))}
                          </div>
                        </div>

                        {enabledEvents.size === 0 && (
                          <div style={{ fontSize: 11, color: "#ef4444", marginTop: 8, fontWeight: 500 }}>
                            Select at least one event type to receive emails
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Test email */}
                  <button
                    onClick={handleTestEmail}
                    disabled={testStatus === "sending" || !addr}
                    style={{
                      alignSelf: "flex-start",
                      background: "transparent",
                      border: `1px solid ${t.border}`,
                      borderRadius: 6,
                      padding: "6px 14px",
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
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
            padding: "12px 18px",
            borderTop: `1px solid ${t.divider}`,
          }}
        >
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: `1px solid ${t.border}`,
              borderRadius: 6,
              padding: "7px 16px",
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
              borderRadius: 6,
              padding: "7px 16px",
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

/* ── Compact chip toggle ── */

function ChipToggle({
  evt,
  checked,
  onToggle,
  t,
}: {
  evt: { key: string; label: string; color: string };
  checked: boolean;
  onToggle: (key: string) => void;
  t: Theme;
}) {
  return (
    <button
      type="button"
      onClick={() => onToggle(evt.key)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "4px 10px",
        borderRadius: 20,
        border: `1px solid ${checked ? evt.color + "40" : t.border}`,
        background: checked ? evt.color + "12" : "transparent",
        cursor: "pointer",
        transition: "all 0.15s",
        fontSize: 11,
        fontWeight: 500,
        color: checked ? evt.color : t.textMuted,
        fontFamily: "var(--font-sans)",
        whiteSpace: "nowrap",
      }}
    >
      <div
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: evt.color,
          opacity: checked ? 1 : 0.35,
          transition: "opacity 0.15s",
        }}
      />
      {evt.label}
    </button>
  );
}

/* ── Section label ── */

function SectionLabel({ t, children }: { t: Theme; children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 11,
        fontWeight: 700,
        color: t.textSecondary,
        fontFamily: "var(--font-mono)",
        letterSpacing: 0.5,
        textTransform: "uppercase",
        marginBottom: 10,
      }}
    >
      {children}
    </div>
  );
}

/* ── Toggle switch ── */

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
        width: 34,
        height: 18,
        borderRadius: 9,
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
          left: enabled ? 18 : 2,
          width: 14,
          height: 14,
          borderRadius: "50%",
          background: "#fff",
          transition: "left 0.2s",
          boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
        }}
      />
    </button>
  );
}
