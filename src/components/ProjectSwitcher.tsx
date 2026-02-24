"use client";

import { useState, useRef, useEffect } from "react";
import type { Theme } from "@/config/themes";
import type { Project } from "@/lib/types/supabase";
import type { Plan } from "@/lib/subscription";
import { getPlanLimits } from "@/lib/subscription";

interface ProjectSwitcherProps {
  projects: Project[];
  activeProjectId: string | null;
  plan: Plan;
  frozenProjectIds?: Set<string>;
  onSelect: (id: string) => void;
  onCreateProject: (name: string) => Promise<void>;
  onUpgrade: () => void;
  onManageProject?: () => void;
  onShare?: () => void;
  showProjectFilter: boolean;
  onToggleFilter: () => void;
  t: Theme;
}

export default function ProjectSwitcher({
  projects,
  activeProjectId,
  plan,
  frozenProjectIds,
  onSelect,
  onCreateProject,
  onUpgrade,
  onManageProject,
  onShare,
  showProjectFilter,
  onToggleFilter,
  t,
}: ProjectSwitcherProps) {
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const activeProject = projects.find((p) => p.id === activeProjectId) || projects[0] || null;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setCreating(false);
        setNewName("");
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }
  }, [open]);

  // Auto-focus input when entering create mode
  useEffect(() => {
    if (creating) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [creating]);

  if (!activeProject) return null;

  async function handleCreate() {
    const name = newName.trim();
    if (!name || saving) return;
    setSaving(true);
    await onCreateProject(name);
    setSaving(false);
    setCreating(false);
    setNewName("");
    setOpen(false);
  }

  return (
    <div ref={ref} style={{ position: "relative", flexShrink: 0 }}>
      {/* Single button — click opens dropdown */}
      <button
        onClick={() => { setOpen(!open); setCreating(false); setNewName(""); }}
        aria-label="Project menu"
        aria-expanded={open}
        style={{
          background: showProjectFilter ? t.stackBtnBg : "transparent",
          color: showProjectFilter ? t.accentPrimary : t.textMuted,
          border: `1px solid ${showProjectFilter ? t.stackBtnBorder : t.border}`,
          borderRadius: 8,
          padding: "6px 12px",
          fontSize: 12,
          fontWeight: 600,
          cursor: "pointer",
          fontFamily: "var(--font-sans)",
          transition: "all 0.15s",
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
        onMouseEnter={(e) => {
          if (!showProjectFilter) e.currentTarget.style.borderColor = t.borderHover;
        }}
        onMouseLeave={(e) => {
          if (!showProjectFilter) e.currentTarget.style.borderColor = t.border;
        }}
      >
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill={showProjectFilter ? t.accentPrimary : "none"}
          stroke={showProjectFilter ? t.accentPrimary : "currentColor"}
          strokeWidth="2"
          style={{ flexShrink: 0 }}
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
        <span className="sh-mystack-label">
          {activeProject.name}{activeProject.service_slugs.length > 0 ? ` (${activeProject.service_slugs.length})` : ""}
        </span>
        <svg
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s",
            flexShrink: 0,
          }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="animate-scale-in"
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            right: 0,
            minWidth: 220,
            background: t.surface,
            border: `1px solid ${t.border}`,
            borderRadius: 10,
            boxShadow: t.shadowMd,
            zIndex: 50,
            overflow: "hidden",
          }}
        >
          {/* Filter toggle */}
          <button
            onClick={() => { onToggleFilter(); setOpen(false); }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              width: "100%",
              padding: "10px 12px",
              background: showProjectFilter ? `${t.accentPrimary}08` : "transparent",
              border: "none",
              borderBottom: `1px solid ${t.border}`,
              cursor: "pointer",
              fontFamily: "var(--font-sans)",
              transition: "background 0.1s",
              textAlign: "left",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = t.surfaceHover; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = showProjectFilter ? `${t.accentPrimary}08` : "transparent"; }}
          >
            <div style={{
              width: 28,
              height: 16,
              borderRadius: 8,
              background: showProjectFilter ? t.accentPrimary : t.tagBg,
              border: `1px solid ${showProjectFilter ? t.accentPrimary : t.border}`,
              position: "relative",
              transition: "all 0.2s",
              flexShrink: 0,
            }}>
              <div style={{
                width: 12,
                height: 12,
                borderRadius: "50%",
                background: showProjectFilter ? "#fff" : t.textMuted,
                position: "absolute",
                top: 1,
                left: showProjectFilter ? 14 : 1,
                transition: "left 0.2s",
              }} />
            </div>
            <span style={{
              fontSize: 12,
              fontWeight: 500,
              color: showProjectFilter ? t.accentPrimary : t.textSecondary,
            }}>
              Filter by project
            </span>
          </button>

          {/* Project list (only if multiple) */}
          {projects.length > 1 && (
            <div style={{ borderBottom: `1px solid ${t.border}` }}>
              <div style={{
                padding: "8px 12px 4px",
                fontSize: 10,
                fontWeight: 600,
                color: t.textMuted,
                fontFamily: "var(--font-mono)",
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}>
                Switch Project
              </div>
              {projects.map((p) => {
                const isFrozenProject = frozenProjectIds?.has(p.id) || false;
                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      onSelect(p.id);
                      setOpen(false);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      width: "100%",
                      padding: "8px 12px",
                      background: p.id === activeProjectId ? `${t.accentPrimary}10` : "transparent",
                      border: "none",
                      cursor: "pointer",
                      fontFamily: "var(--font-sans)",
                      transition: "background 0.1s",
                      textAlign: "left",
                      opacity: isFrozenProject ? 0.6 : 1,
                    }}
                    onMouseEnter={(e) => {
                      if (p.id !== activeProjectId) e.currentTarget.style.background = t.surfaceHover;
                    }}
                    onMouseLeave={(e) => {
                      if (p.id !== activeProjectId) e.currentTarget.style.background = "transparent";
                    }}
                  >
                    {isFrozenProject && (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={t.textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0110 0v4" />
                      </svg>
                    )}
                    <span style={{
                      fontSize: 12,
                      fontWeight: p.id === activeProjectId ? 600 : 400,
                      color: p.id === activeProjectId ? t.accentPrimary : isFrozenProject ? t.textMuted : t.text,
                      flex: 1,
                    }}>
                      {p.name}
                    </span>
                    <span style={{
                      fontSize: 10,
                      color: t.textMuted,
                      fontFamily: "var(--font-mono)",
                    }}>
                      {p.service_slugs.length}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Actions */}
          <div style={{ padding: 4, display: "flex", flexDirection: "column" }}>
            {onManageProject && (
              <MenuButton
                onClick={() => { onManageProject(); setOpen(false); }}
                icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>}
                label="Manage Project"
                color={t.textSecondary}
                t={t}
              />
            )}
            {onShare && (
              <MenuButton
                onClick={() => { onShare(); setOpen(false); }}
                icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" /></svg>}
                label="Copy Share Link"
                color={t.textSecondary}
                t={t}
              />
            )}

            {/* New Project: upgrade hint, inline input, or button */}
            {(() => {
              const limits = getPlanLimits(plan);
              const atLimit = projects.length >= limits.maxProjects;

              if (atLimit) {
                return (
                  <button
                    onClick={() => { onUpgrade(); setOpen(false); }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      width: "100%",
                      padding: "10px 12px",
                      background: `linear-gradient(135deg, ${t.accentPrimary}08, ${t.accentSecondary}08)`,
                      border: "none",
                      borderRadius: 6,
                      cursor: "pointer",
                      fontFamily: "var(--font-sans)",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = `linear-gradient(135deg, ${t.accentPrimary}15, ${t.accentSecondary}15)`; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = `linear-gradient(135deg, ${t.accentPrimary}08, ${t.accentSecondary}08)`; }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={t.accentPrimary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2L2 7l10 5 10-5-10-5z" />
                      <path d="M2 17l10 5 10-5" />
                      <path d="M2 12l10 5 10-5" />
                    </svg>
                    <span style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: t.accentPrimary,
                    }}>
                      Upgrade for more projects
                    </span>
                  </button>
                );
              }

              if (creating) {
                return (
                  <form
                    onSubmit={(e) => { e.preventDefault(); handleCreate(); }}
                    style={{
                      padding: "6px 8px",
                      display: "flex",
                      gap: 6,
                    }}
                  >
                    <input
                      ref={inputRef}
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="Project name"
                      maxLength={40}
                      disabled={saving}
                      style={{
                        flex: 1,
                        padding: "6px 10px",
                        fontSize: 12,
                        fontFamily: "var(--font-sans)",
                        background: t.surfaceHover,
                        border: `1px solid ${t.border}`,
                        borderRadius: 6,
                        color: t.text,
                        outline: "none",
                        minWidth: 0,
                        transition: "border-color 0.15s",
                      }}
                      onFocus={(e) => { e.currentTarget.style.borderColor = t.accentPrimary; }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = t.border; }}
                      onKeyDown={(e) => {
                        if (e.key === "Escape") { setCreating(false); setNewName(""); }
                      }}
                    />
                    <button
                      type="submit"
                      disabled={!newName.trim() || saving}
                      style={{
                        padding: "6px 12px",
                        fontSize: 11,
                        fontWeight: 700,
                        fontFamily: "var(--font-sans)",
                        background: newName.trim() ? t.accentPrimary : t.tagBg,
                        color: newName.trim() ? "#fff" : t.textMuted,
                        border: "none",
                        borderRadius: 6,
                        cursor: newName.trim() && !saving ? "pointer" : "not-allowed",
                        transition: "all 0.15s",
                        whiteSpace: "nowrap",
                        flexShrink: 0,
                      }}
                    >
                      {saving ? "..." : "Create"}
                    </button>
                  </form>
                );
              }

              return (
                <MenuButton
                  onClick={() => setCreating(true)}
                  icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={t.accentPrimary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>}
                  label="New Project"
                  color={t.accentPrimary}
                  t={t}
                />
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}

function MenuButton({ onClick, icon, label, color, t }: {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  color: string;
  t: Theme;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        width: "100%",
        padding: "8px 12px",
        background: "transparent",
        border: "none",
        cursor: "pointer",
        fontFamily: "var(--font-sans)",
        transition: "background 0.1s",
        borderRadius: 6,
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = t.surfaceHover; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
    >
      {icon}
      <span style={{ fontSize: 12, color, fontWeight: 500 }}>{label}</span>
    </button>
  );
}
