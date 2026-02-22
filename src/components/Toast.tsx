"use client";

import { useState, useCallback, createContext, useContext, type ReactNode } from "react";
import type { Theme } from "@/config/themes";

interface ToastItem {
  id: number;
  message: string;
  type: "error" | "success" | "info";
}

interface ToastContextValue {
  showToast: (message: string, type?: "error" | "success" | "info") => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

let nextId = 0;

export function ToastProvider({ children, t }: { children: ReactNode; t: Theme }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((message: string, type: "error" | "success" | "info" = "info") => {
    const id = nextId++;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toasts.length > 0 && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            zIndex: 500,
            display: "flex",
            flexDirection: "column",
            gap: 8,
            maxWidth: 360,
          }}
        >
          {toasts.map((toast) => {
            const colors = {
              error: { bg: "rgba(239,68,68,0.10)", border: "rgba(239,68,68,0.25)", text: "#ef4444" },
              success: { bg: "rgba(22,163,74,0.10)", border: "rgba(22,163,74,0.25)", text: "#16a34a" },
              info: { bg: `${t.accentPrimary}15`, border: `${t.accentPrimary}25`, text: t.accentPrimary },
            }[toast.type];

            return (
              <div
                key={toast.id}
                className="animate-fade-in"
                style={{
                  background: t.surface,
                  border: `1px solid ${colors.border}`,
                  borderLeft: `3px solid ${colors.text}`,
                  borderRadius: 8,
                  padding: "10px 14px",
                  boxShadow: t.shadowMd,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={colors.text}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {toast.type === "error" ? (
                    <>
                      <circle cx="12" cy="12" r="10" />
                      <line x1="15" y1="9" x2="9" y2="15" />
                      <line x1="9" y1="9" x2="15" y2="15" />
                    </>
                  ) : toast.type === "success" ? (
                    <>
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="16 10 11 15 8 12" />
                    </>
                  ) : (
                    <>
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="16" x2="12" y2="12" />
                      <line x1="12" y1="8" x2="12.01" y2="8" />
                    </>
                  )}
                </svg>
                <span style={{ fontSize: 13, color: t.text, fontFamily: "var(--font-sans)", flex: 1 }}>
                  {toast.message}
                </span>
                <button
                  onClick={() => setToasts((prev) => prev.filter((tt) => tt.id !== toast.id))}
                  style={{
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    padding: 2,
                    display: "flex",
                    flexShrink: 0,
                    borderRadius: 4,
                  }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={t.textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </ToastContext.Provider>
  );
}