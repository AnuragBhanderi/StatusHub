"use client";

import { useState, useRef } from "react";
import type { Theme } from "@/config/themes";
import type { Project } from "@/lib/types/supabase";
import type { Plan } from "@/lib/subscription";
import { getPlanLimits } from "@/lib/subscription";

interface ProjectManagerProps {
  project: Project;
  plan: Plan;
  onRename: (id: string, name: string) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
  onReorderServices: (projectId: string, newSlugs: string[]) => Promise<boolean>;
  onRemoveService: (slug: string, projectId: string) => void;
  onSetDefault: (id: string) => Promise<boolean>;
  onClose: () => void;
  t: Theme;
}

export default function ProjectManager({
  project,
  plan,
  onRename,
  onDelete,
  onReorderServices,
  onRemoveService,
  onSetDefault,
  onClose,
  t,
}: ProjectManagerProps) {
  const [name, setName] = useState(project.name);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const dragCounter = useRef(0);

  const limits = getPlanLimits(plan);
  const serviceCount = project.service_slugs.length;
  const isOverServiceLimit = serviceCount > limits.maxServicesPerProject;

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

  async function handleSetDefault() {
    setSaving(true);
    await onSetDefault(project.id);
    setSaving(false);
  }

  function handleDragStart(index: number) {
    setDragIndex(index);
  }

  function handleDragEnter(index: number) {
    dragCounter.current++;
    setDropIndex(index);
  }

  function handleDragLeave() {
    dragCounter.current--;
    if (dragCounter.current <= 0) {
      setDropIndex(null);
      dragCounter.current = 0;
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
  }

  function handleDrop(targetIndex: number) {
    if (dragIndex === null || dragIndex === targetIndex) {
      setDragIndex(null);
      setDropIndex(null);
      dragCounter.current = 0;
      return;
    }

    const newSlugs = [...project.service_slugs];
    const [removed] = newSlugs.splice(dragIndex, 1);
    newSlugs.splice(targetIndex, 0, removed);

    onReorderServices(project.id, newSlugs);
    setDragIndex(null);
    setDropIndex(null);
    dragCounter.current = 0;
  }

  function handleDragEnd() {
    setDragIndex(null);
    setDropIndex(null);
    dragCounter.current = 0;
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
          maxHeight: "85vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div style={{
          padding: "24px 24px 0",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
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

        <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16, overflowY: "auto" }}>
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
              border: `1px solid ${isOverServiceLimit ? "#ef444430" : t.border}`,
            }}>
              <div style={{
                fontSize: 20,
                fontWeight: 700,
                color: isOverServiceLimit ? "#ef4444" : t.text,
                fontFamily: "var(--font-mono)",
              }}>
                {serviceCount}
                <span style={{ fontSize: 12, color: isOverServiceLimit ? "#ef444480" : t.textMuted, fontWeight: 400 }}>/{limits.maxServicesPerProject}</span>
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
              {!project.is_default ? (
                <button
                  onClick={handleSetDefault}
                  disabled={saving}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: t.accentPrimary,
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: saving ? "wait" : "pointer",
                    fontFamily: "var(--font-sans)",
                    padding: 0,
                    marginTop: 4,
                  }}
                >
                  Set as Default
                </button>
              ) : (
                <div style={{
                  fontSize: 11,
                  color: t.textMuted,
                  fontFamily: "var(--font-sans)",
                  marginTop: 4,
                }}>
                  {plan === "pro" ? "Pro Plan" : "Free Plan"}
                </div>
              )}
            </div>
          </div>

          {/* Services list — drag to reorder */}
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
                Services {isOverServiceLimit ? "(drag to prioritize)" : ""}
              </label>
              <div style={{
                display: "flex",
                flexDirection: "column",
                gap: 2,
                borderRadius: 10,
                border: `1px solid ${t.border}`,
                overflow: "hidden",
              }}>
                {project.service_slugs.map((slug, index) => {
                  const isFrozen = isOverServiceLimit && index >= limits.maxServicesPerProject;
                  const isAtLimit = isOverServiceLimit && index === limits.maxServicesPerProject;
                  const isDragging = dragIndex === index;
                  const isDropTarget = dropIndex === index;

                  return (
                    <div key={slug}>
                      {/* Divider line at limit boundary */}
                      {isAtLimit && (
                        <div style={{
                          padding: "4px 12px",
                          background: "#ef444408",
                          borderTop: "1px dashed #ef444440",
                          borderBottom: "1px dashed #ef444410",
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                            <path d="M7 11V7a5 5 0 0110 0v4" />
                          </svg>
                          <span style={{
                            fontSize: 9,
                            fontWeight: 700,
                            color: "#ef4444",
                            fontFamily: "var(--font-mono)",
                            textTransform: "uppercase",
                            letterSpacing: 0.5,
                          }}>
                            Below this: no email alerts (free limit: {limits.maxServicesPerProject})
                          </span>
                        </div>
                      )}
                      <div
                        draggable
                        onDragStart={() => handleDragStart(index)}
                        onDragEnter={() => handleDragEnter(index)}
                        onDragLeave={handleDragLeave}
                        onDragOver={handleDragOver}
                        onDrop={() => handleDrop(index)}
                        onDragEnd={handleDragEnd}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          padding: "7px 10px",
                          background: isDropTarget
                            ? `${t.accentPrimary}12`
                            : isFrozen
                              ? `${t.tagBg}`
                              : "transparent",
                          opacity: isDragging ? 0.4 : 1,
                          cursor: "grab",
                          borderTop: isDropTarget ? `2px solid ${t.accentPrimary}` : "2px solid transparent",
                          transition: "background 0.1s",
                        }}
                      >
                        {/* Drag handle */}
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={t.textMuted} strokeWidth="2" style={{ flexShrink: 0, opacity: 0.4 }}>
                          <line x1="8" y1="6" x2="8" y2="6.01" />
                          <line x1="16" y1="6" x2="16" y2="6.01" />
                          <line x1="8" y1="12" x2="8" y2="12.01" />
                          <line x1="16" y1="12" x2="16" y2="12.01" />
                          <line x1="8" y1="18" x2="8" y2="18.01" />
                          <line x1="16" y1="18" x2="16" y2="18.01" />
                        </svg>

                        {/* Service name */}
                        <span style={{
                          flex: 1,
                          fontSize: 12,
                          color: isFrozen ? t.textMuted : t.textSecondary,
                          fontFamily: "var(--font-mono)",
                        }}>
                          {slug}
                        </span>

                        {/* Frozen indicator */}
                        {isFrozen && (
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, opacity: 0.6 }}>
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                            <path d="M7 11V7a5 5 0 0110 0v4" />
                          </svg>
                        )}

                        {/* Remove button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemoveService(slug, project.id);
                          }}
                          style={{
                            background: "transparent",
                            border: "none",
                            cursor: "pointer",
                            color: t.textMuted,
                            padding: 2,
                            flexShrink: 0,
                            opacity: 0.5,
                            transition: "opacity 0.1s",
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.color = "#ef4444"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.opacity = "0.5"; e.currentTarget.style.color = t.textMuted; }}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Over-limit hint */}
              {isOverServiceLimit && (
                <div style={{
                  marginTop: 8,
                  fontSize: 10,
                  color: t.textMuted,
                  fontFamily: "var(--font-sans)",
                  lineHeight: 1.4,
                }}>
                  Only the first {limits.maxServicesPerProject} services receive email alerts on the {plan} plan. Drag to prioritize or remove services.
                </div>
              )}
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
