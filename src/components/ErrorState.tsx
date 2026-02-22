"use client";

import type { Theme } from "@/config/themes";

interface ErrorStateProps {
  t: Theme;
  title?: string;
  description?: string;
  onRetry?: () => void;
}

export default function ErrorState({
  t,
  title = "Unable to fetch status data",
  description = "Could not connect to the status APIs. This may be a network issue or the services may be temporarily unavailable.",
  onRetry,
}: ErrorStateProps) {
  return (
    <div
      className="animate-fade-in"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "120px 24px",
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 10,
          background: "#ef444410",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 20,
        }}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#ef4444"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>

      <div
        style={{
          fontSize: 16,
          fontWeight: 600,
          color: t.text,
          marginBottom: 8,
        }}
      >
        {title}
      </div>

      <div
        style={{
          fontSize: 13,
          color: t.textMuted,
          textAlign: "center",
          maxWidth: 360,
          lineHeight: 1.5,
          marginBottom: onRetry ? 24 : 0,
        }}
      >
        {description}
      </div>

      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            background: t.accentPrimary,
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "10px 24px",
            fontSize: 13,
            fontWeight: 600,
            fontFamily: "var(--font-sans)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 7,
          }}
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
            <polyline points="23 4 23 10 17 10" />
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
          </svg>
          Retry
        </button>
      )}
    </div>
  );
}
