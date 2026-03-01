import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Live Status Dashboard - Monitor 48+ Cloud Services | StatusHub",
  description:
    "Real-time status dashboard for AWS, GitHub, Vercel, Stripe, OpenAI, Slack, and 42 more cloud services. Auto-refreshes every minute. Free, no signup.",
  keywords: [
    "status dashboard",
    "cloud status dashboard",
    "service status dashboard",
    "real-time status monitoring",
    "cloud service monitor",
    "aws github status dashboard",
    "multi-service status page",
    "unified status dashboard",
    "devops dashboard",
    "infrastructure status",
    "outage dashboard",
    "downtime monitor",
    "service health dashboard",
    "cloud outage tracker",
    "is my service down",
    "status page aggregator dashboard",
    "free status monitoring",
    "saas status monitor",
  ],
  alternates: {
    canonical: "https://statushub.live/dashboard",
  },
  openGraph: {
    title: "Live Status Dashboard - Monitor 48+ Cloud Services | StatusHub",
    description:
      "Real-time status dashboard for AWS, GitHub, Vercel, Stripe, OpenAI, and 43 more services. Auto-refreshes every minute.",
    url: "/dashboard",
    siteName: "StatusHub",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Live Status Dashboard | StatusHub",
    description:
      "Monitor 48+ cloud service statuses in real-time. Auto-refreshes every minute. Free.",
  },
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
