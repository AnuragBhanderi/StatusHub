"use client";

import { useState, useRef, useEffect } from "react";
import type { Theme } from "@/config/themes";
import type { Project } from "@/lib/types/supabase";

interface ProjectSwitcherProps {
  projects: Project[];
  activeProjectId: string | null;
  onSelect: (id: string) => void;
  onNewProject: () => void;
  showProjectFilter: boolean;
  onToggleFilter: () => void;
  t: Theme;
}

export default function ProjectSwitcher({
  projects,
  activeProjectId,
  onSelect,
  onNewProject,
  showProjectFilter,
  onToggleFilter,
  t,
}: ProjectSwitcherProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const activeProject = projects.find((p) => p.id === activeProjectId) || projects[0] || null;

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }
  }, [open]);

  if (!activeProject) return null;

  return (
    <div ref={ref} style={{ position: "relative", flexShrink: 0 }}>
      {/* Main button: shows active project name + toggles project filter */}
      <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
        <button
          onClick={onToggleFilter}
          aria-label={showProjectFilter ? "Show all services" : `Show ${activeProject.name}`}
          aria-pressed={showProjectFilter}
          style={{
            background: showProjectFilter ? t.stackBtnBg : "transparent",
            color: showProjectFilter ? t.accentPrimary : t.textMuted,
            border: `1px solid ${showProjectFilter ? t.stackBtnBorder : t.border}`,
            borderRadius: projects.length > 1 ? "8px 0 0 8px" : 8,
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
        </button>

        {/* Dropdown trigger for project switching (only if multiple projects) */}
        {projects.length > 1 && (
          <button
            onClick={() => setOpen(!open)}
            aria-label="Switch project"
            style={{
              background: showProjectFilter ? t.stackBtnBg : "transparent",
              color: showProjectFilter ? t.accentPrimary : t.textMuted,
              border: `1px solid ${showProjectFilter ? t.stackBtnBorder : t.border}`,
              borderLeft: "none",
              borderRadius: "0 8px 8px 0",
              padding: "6px 6px",
              fontSize: 12,
              cursor: "pointer",
              fontFamily: "var(--font-sans)",
              transition: "all 0.15s",
              display: "flex",
              alignItems: "center",
            }}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points={open ? "18 15 12 9 6 15" : "6 9 12 15 18 9"} />
            </svg>
          </button>
        )}
      </div>

      {/* Dropdown */}
      {open && (
        <div
          className="animate-scale-in"
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            right: 0,
            minWidth: 200,
            background: t.surface,
            border: `1px solid ${t.border}`,
            borderRadius: 10,
            boxShadow: t.shadowMd,
            zIndex: 50,
            overflow: "hidden",
          }}
        >
          <div style={{
            padding: "8px 12px 4px",
            fontSize: 10,
            fontWeight: 600,
            color: t.textMuted,
            fontFamily: "var(--font-mono)",
            textTransform: "uppercase",
            letterSpacing: 0.5,
          }}>
            Projects
          </div>
          {projects.map((p) => (
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
              }}
              onMouseEnter={(e) => {
                if (p.id !== activeProjectId) e.currentTarget.style.background = t.surfaceHover;
              }}
              onMouseLeave={(e) => {
                if (p.id !== activeProjectId) e.currentTarget.style.background = "transparent";
              }}
            >
              <span style={{
                fontSize: 12,
                fontWeight: p.id === activeProjectId ? 600 : 400,
                color: p.id === activeProjectId ? t.accentPrimary : t.text,
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
              {p.is_default && (
                <span style={{
                  fontSize: 9,
                  color: t.textMuted,
                  background: t.tagBg,
                  padding: "1px 5px",
                  borderRadius: 4,
                  fontFamily: "var(--font-mono)",
                }}>
                  default
                </span>
              )}
            </button>
          ))}
          <div style={{ borderTop: `1px solid ${t.border}`, padding: 4 }}>
            <button
              onClick={() => {
                onNewProject();
                setOpen(false);
              }}
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
              onMouseEnter={(e) => {
                e.currentTarget.style.background = t.surfaceHover;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={t.accentPrimary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span style={{ fontSize: 12, color: t.accentPrimary, fontWeight: 500 }}>
                New Project
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
