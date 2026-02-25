export interface ChangelogFeature {
  title: string;
  description: string;
}

export interface ChangelogEntry {
  id: string;
  date: string;
  title: string;
  summary: string;
  features: ChangelogFeature[];
}

// Add new entries at the TOP. The first entry is shown to new users.
export const CHANGELOG: ChangelogEntry[] = [
  {
    id: "2026-02-25-1-minute-refresh",
    date: "2026-02-25",
    title: "1-Minute Refresh & Faster Alerts",
    summary:
      "Dashboard now refreshes every minute instead of every 3 minutes, so you see status changes faster.",
    features: [
      {
        title: "1-Minute Dashboard Refresh",
        description:
          "The dashboard now auto-refreshes every 60 seconds, synced with our cron monitoring for near real-time updates.",
      },
      {
        title: "Faster Server-Side Caching",
        description:
          "Reduced upstream cache times so status changes from AWS, GCP, Azure, and all services appear sooner.",
      },
      {
        title: "48 Services Monitored",
        description:
          "Monitor AWS, GCP, Azure, GitHub, Stripe, Vercel, OpenAI, Anthropic, and more — all from one dashboard.",
      },
    ],
  },
  {
    id: "2026-02-23-projects-and-alerts",
    date: "2026-02-23",
    title: "Projects, Alerts & Pro Plans",
    summary:
      "Organize services into projects, get notified when they go down, and unlock more with Pro.",
    features: [
      {
        title: "Projects",
        description:
          "Group the services you care about into named projects. Star any service to add it.",
      },
      {
        title: "Email & Push Alerts",
        description:
          "Get notified by email or browser push when a service in your project goes down.",
      },
      {
        title: "Pro Plan",
        description:
          "Unlock 3 projects, 7 services each, and premium features. Free trials available!",
      },
      {
        title: "43+ Services",
        description:
          "Monitor AWS, GCP, Azure, GitHub, Stripe, Vercel, and more — all from one dashboard.",
      },
    ],
  },
];

export function getLatestChangelogId(): string | null {
  return CHANGELOG.length > 0 ? CHANGELOG[0].id : null;
}

export function getUnseenChangelog(
  lastSeenId: string | null
): ChangelogEntry[] {
  if (!lastSeenId) return CHANGELOG.slice(0, 1); // Show latest to brand-new users
  const lastSeenIndex = CHANGELOG.findIndex((e) => e.id === lastSeenId);
  if (lastSeenIndex <= 0) return []; // Already seen latest, or ID not found
  return CHANGELOG.slice(0, lastSeenIndex); // All entries newer than last seen
}
