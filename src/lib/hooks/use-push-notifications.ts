"use client";

import { useEffect, useRef } from "react";
import { STATUS_DISPLAY } from "@/lib/normalizer";

interface ServiceData {
  slug: string;
  name: string;
  currentStatus: string;
  latestIncident: { title: string } | null;
}

export function usePushNotifications(
  services: ServiceData[],
  projectSlugs: string[],
  enabled: boolean
) {
  const prevStatuses = useRef<Map<string, string>>(new Map());
  const isFirstPoll = useRef(true);

  useEffect(() => {
    if (!enabled || services.length === 0) return;
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission !== "granted") return;

    // On first poll, just record baseline — don't fire notifications
    if (isFirstPoll.current) {
      isFirstPoll.current = false;
      const map = new Map<string, string>();
      for (const s of services) {
        map.set(s.slug, s.currentStatus);
      }
      prevStatuses.current = map;
      return;
    }

    const stackSet = new Set(projectSlugs);

    for (const service of services) {
      if (!stackSet.has(service.slug)) continue;

      const oldStatus = prevStatuses.current.get(service.slug);
      if (oldStatus && oldStatus !== service.currentStatus) {
        const oldDisplay = STATUS_DISPLAY[oldStatus] || { label: oldStatus };
        const newDisplay = STATUS_DISPLAY[service.currentStatus] || { label: service.currentStatus };

        const body = service.latestIncident
          ? `${oldDisplay.label} → ${newDisplay.label}\n${service.latestIncident.title}`
          : `${oldDisplay.label} → ${newDisplay.label}`;

        new Notification(`StatusHub: ${service.name}`, {
          body,
          tag: `statushub-${service.slug}`,
          icon: "/favicon.ico",
        });
      }
    }

    // Update stored statuses
    const map = new Map<string, string>();
    for (const s of services) {
      map.set(s.slug, s.currentStatus);
    }
    prevStatuses.current = map;
  }, [services, projectSlugs, enabled]);
}
