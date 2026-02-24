"use client";

import { useState, useRef } from "react";
import type { Theme } from "@/config/themes";
import type { Project } from "@/lib/types/supabase";
import type { Plan } from "@/lib/subscription";
import { getPlanLimits } from "@/lib/subscription";
import { services as serviceConfigs } from "@/config/services";
import LogoIcon from "./LogoIcon";

interface ProjectManagerProps {
  project: Project;
  plan: Plan;
  onRename: (id: string, name: string) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
  onReorderServices: (projectId: string, newSlugs: string[]) => Promise<boolean>;
  onRemoveService: (slug: string, projectId: string) => void;
  onSetDefault: (id: string) => Promise<boolean>;
  onUpgrade: () => void;
  onClose: () => void;
  t: Theme;
}

// Build a lookup map: slug → { name, logoUrl }
const serviceMap = new Map(
  serviceConfigs.map((s) => [s.slug, { name: s.name, logoUrl: s.logoUrl || null }])
);

export default function ProjectManager({
  project,
  plan,
  onRename,
  onDelete,
  onReorderServices,
  onRemoveService,
  onSetDefault,
  onUpgrade,
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

  function moveService(fromIndex: number, toIndex: number) {
    if (toIndex < 0 || toIndex >= serviceCount) return;
    const newSlugs = [...project.service_slugs];
    const [removed] = newSlugs.splice(fromIndex, 1);
    newSlugs.splice(toIndex, 0, removed);
    onReorderServices(project.id, newSlugs);
  }

  // --- Drag handlers ---
  function handleDragStart(index: number, e: React.DragEvent) {
    setDragIndex(index);
    e.dataTransfer.effectAllowed = "move";
  }
  function handleDragEnter(index: number) {
    dragCounter.current++;
    setDropIndex(index);
  }
  function handleDragLeave() {
    dragCounter.current--;
    if (dragCounter.current <= 0) { setDropIndex(null); dragCounter.current = 0; }
  }
  function handleDragOver(e: React.DragEvent) { e.preventDefault(); }
  function handleDrop(targetIndex: number) {
    if (dragIndex !== null && dragIndex !== targetIndex) {
      moveService(dragIndex, targetIndex);
    }
    setDragIndex(null); setDropIndex(null); dragCounter.current = 0;
  }
  function handleDragEnd() {
    setDragIndex(null); setDropIndex(null); dragCounter.current = 0;
  }

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
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
          maxWidth: 440,
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
          padding: "20px 24px 0",
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

        <div style={{ padding: "16px 24px 24px", display: "flex", flexDirection: "column", gap: 14, overflowY: "auto" }}>
          {/* Name */}
          <div>
            <SectionLabel t={t}>Project Name</SectionLabel>
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
                onKeyDown={(e) => { if (e.key === "Enter") handleRename(); }}
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

          {/* Stats row */}
          <div style={{ display: "flex", gap: 10 }}>
            {/* Service count */}
            <div style={{
              flex: 1,
              padding: "10px 12px",
              borderRadius: 10,
              background: isOverServiceLimit ? "#ef444406" : t.tagBg,
              border: `1px solid ${isOverServiceLimit ? "#ef444425" : t.border}`,
            }}>
              <div style={{
                fontSize: 18,
                fontWeight: 700,
                color: isOverServiceLimit ? "#ef4444" : t.text,
                fontFamily: "var(--font-mono)",
                lineHeight: 1,
              }}>
                {serviceCount}
                <span style={{ fontSize: 11, color: isOverServiceLimit ? "#ef444460" : t.textMuted, fontWeight: 400 }}>/{limits.maxServicesPerProject}</span>
              </div>
              <div style={{ fontSize: 10, color: t.textMuted, fontFamily: "var(--font-sans)", marginTop: 3 }}>
                Services
              </div>
            </div>

            {/* Default / Custom status */}
            <div style={{
              flex: 1,
              padding: "10px 12px",
              borderRadius: 10,
              background: t.tagBg,
              border: `1px solid ${t.border}`,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}>
              {project.is_default ? (
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: t.accentGreen, flexShrink: 0 }} />
                    <span style={{ fontSize: 11, fontWeight: 600, color: t.accentGreen, fontFamily: "var(--font-mono)", textTransform: "uppercase" }}>Default</span>
                  </div>
                  <div style={{ fontSize: 10, color: t.textMuted, fontFamily: "var(--font-sans)", marginTop: 3 }}>
                    {plan === "pro" ? "Pro" : "Free"} plan
                  </div>
                </>
              ) : (
                <>
                  <span style={{ fontSize: 11, fontWeight: 600, color: t.textMuted, fontFamily: "var(--font-mono)", textTransform: "uppercase" }}>Custom</span>
                  <button
                    onClick={handleSetDefault}
                    disabled={saving}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: t.accentPrimary,
                      fontSize: 10,
                      fontWeight: 600,
                      cursor: saving ? "wait" : "pointer",
                      fontFamily: "var(--font-sans)",
                      padding: 0,
                      marginTop: 3,
                      textAlign: "left",
                    }}
                  >
                    Set as default
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Upgrade nudge — shown when over any limit */}
          {isOverServiceLimit && (
            <button
              onClick={() => { onClose(); onUpgrade(); }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                width: "100%",
                padding: "10px 14px",
                borderRadius: 10,
                border: `1px solid ${t.accentPrimary}20`,
                background: `linear-gradient(135deg, ${t.accentPrimary}06, ${t.accentSecondary}06)`,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = `${t.accentPrimary}40`;
                e.currentTarget.style.background = `linear-gradient(135deg, ${t.accentPrimary}10, ${t.accentSecondary}10)`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = `${t.accentPrimary}20`;
                e.currentTarget.style.background = `linear-gradient(135deg, ${t.accentPrimary}06, ${t.accentSecondary}06)`;
              }}
            >
              <div style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                background: `${t.accentPrimary}15`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill={t.accentPrimary} stroke="none">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </div>
              <div style={{ flex: 1, textAlign: "left" }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: t.accentPrimary, fontFamily: "var(--font-sans)" }}>
                  Upgrade to Pro
                </div>
                <div style={{ fontSize: 10, color: t.textMuted, fontFamily: "var(--font-sans)", marginTop: 1 }}>
                  Get {getPlanLimits("pro").maxServicesPerProject} services per project and {getPlanLimits("pro").maxProjects} projects
                </div>
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={t.accentPrimary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, opacity: 0.5 }}>
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          )}

          {/* Services list — reorderable */}
          {serviceCount > 0 && (
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <SectionLabel t={t} noMargin>
                  Services
                </SectionLabel>
                {isOverServiceLimit && (
                  <span style={{
                    fontSize: 9,
                    fontWeight: 600,
                    color: "#f59e0b",
                    fontFamily: "var(--font-mono)",
                    textTransform: "uppercase",
                    letterSpacing: 0.3,
                    padding: "2px 6px",
                    borderRadius: 4,
                    background: "#f59e0b12",
                    border: "1px solid #f59e0b20",
                  }}>
                    Drag to prioritize
                  </span>
                )}
              </div>

              <div style={{
                display: "flex",
                flexDirection: "column",
                gap: 0,
                borderRadius: 10,
                border: `1px solid ${t.border}`,
                overflow: "hidden",
              }}>
                {project.service_slugs.map((slug, index) => {
                  const info = serviceMap.get(slug);
                  const serviceName = info?.name || slug;
                  const logoUrl = info?.logoUrl || null;
                  const isFrozen = isOverServiceLimit && index >= limits.maxServicesPerProject;
                  const isAtLimit = isOverServiceLimit && index === limits.maxServicesPerProject;
                  const isDragging = dragIndex === index;
                  const isDropTarget = dropIndex === index;
                  const isFirst = index === 0;
                  const isLast = index === serviceCount - 1;

                  return (
                    <div key={slug}>
                      {/* Limit divider */}
                      {isAtLimit && (
                        <div style={{
                          padding: "5px 12px",
                          background: `linear-gradient(90deg, #f59e0b08, transparent)`,
                          borderTop: "1px dashed #f59e0b40",
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                            <path d="M12 9v4" /><path d="M12 17h.01" />
                            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                          </svg>
                          <span style={{
                            fontSize: 9,
                            fontWeight: 600,
                            color: "#f59e0b",
                            fontFamily: "var(--font-sans)",
                          }}>
                            Below: no email alerts ({plan} plan limit: {limits.maxServicesPerProject})
                          </span>
                        </div>
                      )}

                      {/* Service row */}
                      <div
                        draggable
                        onDragStart={(e) => handleDragStart(index, e)}
                        onDragEnter={() => handleDragEnter(index)}
                        onDragLeave={handleDragLeave}
                        onDragOver={handleDragOver}
                        onDrop={() => handleDrop(index)}
                        onDragEnd={handleDragEnd}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          padding: "8px 10px",
                          background: isDropTarget
                            ? `${t.accentPrimary}10`
                            : isFrozen
                              ? `${t.tagBg}80`
                              : "transparent",
                          opacity: isDragging ? 0.35 : 1,
                          cursor: "grab",
                          borderTop: index > 0 && !isAtLimit ? `1px solid ${t.border}30` : "none",
                          transition: "background 0.1s, opacity 0.15s",
                          position: "relative",
                        }}
                      >
                        {/* Drop indicator line */}
                        {isDropTarget && !isDragging && (
                          <div style={{
                            position: "absolute",
                            top: -1,
                            left: 8,
                            right: 8,
                            height: 2,
                            borderRadius: 1,
                            background: t.accentPrimary,
                          }} />
                        )}

                        {/* Position number */}
                        <span style={{
                          width: 18,
                          textAlign: "center",
                          fontSize: 10,
                          fontWeight: 600,
                          color: isFrozen ? t.textMuted : t.textSecondary,
                          fontFamily: "var(--font-mono)",
                          opacity: isFrozen ? 0.5 : 0.4,
                          flexShrink: 0,
                        }}>
                          {index + 1}
                        </span>

                        {/* Logo */}
                        <div style={{ opacity: isFrozen ? 0.4 : 1, flexShrink: 0 }}>
                          <LogoIcon name={serviceName} logoUrl={logoUrl} size={24} t={t} />
                        </div>

                        {/* Name */}
                        <span style={{
                          flex: 1,
                          fontSize: 12,
                          fontWeight: 500,
                          color: isFrozen ? t.textMuted : t.text,
                          fontFamily: "var(--font-sans)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          opacity: isFrozen ? 0.6 : 1,
                        }}>
                          {serviceName}
                        </span>

                        {/* Frozen badge */}
                        {isFrozen && (
                          <span style={{
                            fontSize: 8,
                            fontWeight: 700,
                            color: "#f59e0b",
                            fontFamily: "var(--font-mono)",
                            textTransform: "uppercase",
                            letterSpacing: 0.3,
                            padding: "1px 4px",
                            borderRadius: 3,
                            background: "#f59e0b10",
                            border: "1px solid #f59e0b20",
                            flexShrink: 0,
                          }}>
                            Paused
                          </span>
                        )}

                        {/* Move up/down arrows */}
                        <div style={{ display: "flex", flexDirection: "column", gap: 1, flexShrink: 0 }}>
                          <button
                            onClick={(e) => { e.stopPropagation(); moveService(index, index - 1); }}
                            disabled={isFirst}
                            aria-label="Move up"
                            style={{
                              background: "transparent",
                              border: "none",
                              cursor: isFirst ? "default" : "pointer",
                              color: t.textMuted,
                              padding: 0,
                              opacity: isFirst ? 0.15 : 0.4,
                              transition: "opacity 0.1s",
                              lineHeight: 0,
                            }}
                            onMouseEnter={(e) => { if (!isFirst) e.currentTarget.style.opacity = "1"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.opacity = isFirst ? "0.15" : "0.4"; }}
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="18 15 12 9 6 15" />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); moveService(index, index + 1); }}
                            disabled={isLast}
                            aria-label="Move down"
                            style={{
                              background: "transparent",
                              border: "none",
                              cursor: isLast ? "default" : "pointer",
                              color: t.textMuted,
                              padding: 0,
                              opacity: isLast ? 0.15 : 0.4,
                              transition: "opacity 0.1s",
                              lineHeight: 0,
                            }}
                            onMouseEnter={(e) => { if (!isLast) e.currentTarget.style.opacity = "1"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.opacity = isLast ? "0.15" : "0.4"; }}
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="6 9 12 15 18 9" />
                            </svg>
                          </button>
                        </div>

                        {/* Remove button */}
                        <button
                          onClick={(e) => { e.stopPropagation(); onRemoveService(slug, project.id); }}
                          aria-label={`Remove ${serviceName}`}
                          style={{
                            background: "transparent",
                            border: "none",
                            cursor: "pointer",
                            color: t.textMuted,
                            padding: 2,
                            flexShrink: 0,
                            opacity: 0.3,
                            transition: "all 0.1s",
                            lineHeight: 0,
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.color = "#ef4444"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.opacity = "0.3"; e.currentTarget.style.color = t.textMuted; }}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Info text */}
              {isOverServiceLimit && (
                <div style={{
                  marginTop: 8,
                  padding: "8px 10px",
                  borderRadius: 8,
                  background: t.tagBg,
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 8,
                }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={t.textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
                    <circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" />
                  </svg>
                  <span style={{ fontSize: 10, color: t.textMuted, fontFamily: "var(--font-sans)", lineHeight: 1.5 }}>
                    The first {limits.maxServicesPerProject} services receive email alerts. Reorder to choose which ones stay active, or remove services to get within your plan limit.
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Empty state */}
          {serviceCount === 0 && (
            <div style={{
              textAlign: "center",
              padding: "20px 0",
              color: t.textMuted,
              fontSize: 12,
              fontFamily: "var(--font-sans)",
            }}>
              No services yet. Star services on the dashboard to add them.
            </div>
          )}

          {/* Delete */}
          {!project.is_default && (
            <div style={{ borderTop: `1px solid ${t.border}`, paddingTop: 14 }}>
              {!confirmDelete ? (
                <button
                  onClick={() => setConfirmDelete(true)}
                  style={{
                    background: "transparent",
                    border: `1px solid #ef444430`,
                    borderRadius: 8,
                    padding: "8px 14px",
                    fontSize: 12,
                    fontWeight: 500,
                    color: "#ef4444",
                    cursor: "pointer",
                    fontFamily: "var(--font-sans)",
                    transition: "all 0.15s",
                    width: "100%",
                    opacity: 0.8,
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.borderColor = "#ef444460"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.opacity = "0.8"; e.currentTarget.style.borderColor = "#ef444430"; }}
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

function SectionLabel({ children, t, noMargin }: { children: React.ReactNode; t: Theme; noMargin?: boolean }) {
  return (
    <div style={{
      fontSize: 10,
      fontWeight: 600,
      color: t.textMuted,
      fontFamily: "var(--font-mono)",
      marginBottom: noMargin ? 0 : 6,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    }}>
      {children}
    </div>
  );
}
