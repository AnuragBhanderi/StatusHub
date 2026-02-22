"use client";

import { useState } from "react";
import type { Theme } from "@/config/themes";

interface LogoIconProps {
  name: string;
  logoUrl?: string | null;
  size?: number;
  t: Theme;
}

export default function LogoIcon({
  name,
  logoUrl,
  size = 32,
  t,
}: LogoIconProps) {
  const [err, setErr] = useState(false);

  if (err || !logoUrl) {
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: size * 0.25,
          backgroundColor: t.logoBg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: t.textMuted,
          fontSize: size * 0.38,
          fontWeight: 700,
          fontFamily: "var(--font-mono)",
          flexShrink: 0,
          border: `1px solid ${t.logoBorder}`,
        }}
      >
        {name.substring(0, 2).toUpperCase()}
      </div>
    );
  }

  // On light theme, add a dark drop-shadow so white/light logos remain visible
  // On dark themes, add a light drop-shadow so dark logos remain visible
  const isLight = t.name === "Light";

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.25,
        overflow: "hidden",
        backgroundColor: t.logoBg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        border: `1px solid ${t.logoBorder}`,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={logoUrl}
        alt=""
        width={size * 0.6}
        height={size * 0.6}
        style={{
          objectFit: "contain",
          filter: isLight
            ? "drop-shadow(0 0 0.5px rgba(0,0,0,0.4)) drop-shadow(0 0 1px rgba(0,0,0,0.2))"
            : "drop-shadow(0 0 0.5px rgba(255,255,255,0.5)) drop-shadow(0 0 1px rgba(255,255,255,0.3))",
        }}
        onError={() => setErr(true)}
      />
    </div>
  );
}
