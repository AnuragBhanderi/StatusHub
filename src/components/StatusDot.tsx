"use client";

import { STATUS_DISPLAY } from "@/lib/normalizer";

interface StatusDotProps {
  status: string;
  size?: number;
}

export default function StatusDot({ status, size = 8 }: StatusDotProps) {
  const config = STATUS_DISPLAY[status] || STATUS_DISPLAY.OPERATIONAL;
  const pulse = status !== "OPERATIONAL";

  return (
    <span
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: size + 10,
        height: size + 10,
      }}
    >
      {pulse && (
        <span
          className="animate-pulse-dot"
          style={{
            position: "absolute",
            width: size + 6,
            height: size + 6,
            borderRadius: "50%",
            backgroundColor: config.color,
            opacity: 0.35,
          }}
        />
      )}
      <span
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          backgroundColor: config.color,
          position: "relative",
          zIndex: 1,
          boxShadow: `0 0 8px ${config.color}66`,
        }}
      />
    </span>
  );
}
