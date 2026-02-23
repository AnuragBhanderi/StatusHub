"use client";

import { useState } from "react";
import type { Theme } from "@/config/themes";
import type { Project } from "@/lib/types/supabase";
import type { Plan } from "@/lib/subscription";
import { getPlanLimits } from "@/lib/subscription";

interface ProjectManagerProps {
  project: Project;
  plan: Plan;
  onRename: (id: string, name: string) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
  onClose: () => void;
  t: Theme;
}

export default function ProjectManager({
  project,
  plan,
  onRename,
  onDelete,
  onClose,
  t,
}: ProjectManagerProps) {
  const [name, setName] = useState(project.name);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const limits = getPlanLimits(plan);
  const serviceCount = project.service_slugs.length;

  async function handleRename() {
    const trimmed = name.trim();
    if (!trimmed || trimmed === project.name) return;
    setSaving(true);
    await onRename(project.id, trimmed);
    setSaving(false);
  }

  async function handleDelete() {
    setSaving(true);
    const ok = await onDelete(project.id);
    setSaving(false);
    if (ok) onClose();
  }

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 300,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.5)",
        backdropFilter: "blur(4px)",
        padding: 24,
      }}
    >
      <div
        className="animate-scale-in"
        style={{
          background: t.surface,
          border: `1px solid ${t.border}`,
          borderRadius: 16,
          maxWidth: 420,
          width: "100%",
          boxShadow: t.shadowLg,
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div style={{
          padding: "24px 24px 0",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          <h2 style={{
            margin: 0,
            fontSize: 16,
            fontWeight: 700,
            color: t.text,
            fontFamily: "var(--font-sans)",
          }}>
            Manage Project
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: t.textMuted,
              padding: 4,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Name */}
          <div>
            <label style={{
              display: "block",
              fontSize: 11,
              fontWeight: 600,
              color: t.textMuted,
              fontFamily: "var(--font-mono)",
              marginBottom: 6,
              textTransform: "uppercase",
              letterSpacing: 0.5,
            }}>
              Project Name
            </label>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={100}
                style={{
                  flex: 1,
                  padding: "8px 12px",
                  borderRadius: 8,
                  border: `1px solid ${t.border}`,
                  background: t.searchBg,
                  color: t.text,
                  fontSize: 13,
                  fontFamily: "var(--font-sans)",
                  outline: "none",
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleRename();
                }}
              />
              <button
                onClick={handleRename}
                disabled={saving || name.trim() === project.name || !name.trim()}
                style={{
                  padding: "8px 14px",
                  borderRadius: 8,
                  border: "none",
                  background: t.accentPrimary,
                  color: "#fff",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: saving ? "wait" : "pointer",
                  fontFamily: "var(--font-sans)",
                  opacity: (saving || name.trim() === project.name || !name.trim()) ? 0.5 : 1,
                  transition: "opacity 0.15s",
                }}
              >
                Save
              </button>
            </div>
          </div>

          {/* Stats */}
          <div style={{
            display: "flex",
            gap: 12,
          }}>
            <div style={{
              flex: 1,
              padding: "12px 14px",
              borderRadius: 10,
              background: t.tagBg,
              border: `1px solid ${t.border}`,
            }}>
              <div style={{
                fontSize: 20,
                fontWeight: 700,
                color: t.text,
                fontFamily: "var(--font-mono)",
              }}>
                {serviceCount}
                <span style={{ fontSize: 12, color: t.textMuted, fontWeight: 400 }}>/{limits.maxServicesPerProject}</span>
              </div>
              <div style={{
                fontSize: 11,
                color: t.textMuted,
                fontFamily: "var(--font-sans)",
                marginTop: 2,
              }}>
                Services
              </div>
            </div>
            <div style={{
              flex: 1,
              padding: "12px 14px",
              borderRadius: 10,
              background: t.tagBg,
              border: `1px solid ${t.border}`,
            }}>
              <div style={{
                fontSize: 11,
                fontWeight: 600,
                color: project.is_default ? t.accentGreen : t.textMuted,
                fontFamily: "var(--font-mono)",
                textTransform: "uppercase",
              }}>
                {project.is_default ? "Default" : "Custom"}
              </div>
              <div style={{
                fontSize: 11,
                color: t.textMuted,
                fontFamily: "var(--font-sans)",
                marginTop: 4,
              }}>
                {plan === "pro" ? "Pro Plan" : "Free Plan"}
              </div>
            </div>
          </div>

          {/* Services list */}
          {serviceCount > 0 && (
            <div>
              <label style={{
                display: "block",
                fontSize: 11,
                fontWeight: 600,
                color: t.textMuted,
                fontFamily: "var(--font-mono)",
                marginBottom: 6,
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}>
                Services
              </label>
              <div style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 4,
              }}>
                {project.service_slugs.map((slug) => (
                  <span
                    key={slug}
                    style={{
                      padding: "3px 8px",
                      borderRadius: 6,
                      background: t.tagBg,
                      border: `1px solid ${t.border}`,
                      fontSize: 11,
                      color: t.textSecondary,
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    {slug}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Delete */}
          {!project.is_default && (
            <div style={{ borderTop: `1px solid ${t.border}`, paddingTop: 16 }}>
              {!confirmDelete ? (
                <button
                  onClick={() => setConfirmDelete(true)}
                  style={{
                    background: "transparent",
                    border: `1px solid #ef444440`,
                    borderRadius: 8,
                    padding: "8px 14px",
                    fontSize: 12,
                    fontWeight: 500,
                    color: "#ef4444",
                    cursor: "pointer",
                    fontFamily: "var(--font-sans)",
                    transition: "all 0.15s",
                    width: "100%",
                  }}
                >
                  Delete Project
                </button>
              ) : (
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    style={{
                      flex: 1,
                      padding: "8px 0",
                      borderRadius: 8,
                      border: `1px solid ${t.border}`,
                      background: "transparent",
                      color: t.textSecondary,
                      fontSize: 12,
                      fontWeight: 500,
                      cursor: "pointer",
                      fontFamily: "var(--font-sans)",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={saving}
                    style={{
                      flex: 1,
                      padding: "8px 0",
                      borderRadius: 8,
                      border: "none",
                      background: "#ef4444",
                      color: "#fff",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: saving ? "wait" : "pointer",
                      fontFamily: "var(--font-sans)",
                    }}
                  >
                    {saving ? "Deleting..." : "Confirm Delete"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
