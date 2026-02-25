import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard | StatusHub",
  description:
    "Monitor the real-time status of 48 cloud services including AWS, GitHub, Vercel, Stripe, and more. Auto-refreshes every minute.",
  openGraph: {
    title: "Dashboard | StatusHub",
    description:
      "Monitor the real-time status of 48 cloud services including AWS, GitHub, Vercel, Stripe, and more. Auto-refreshes every minute.",
    url: "/dashboard",
    siteName: "StatusHub",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Dashboard | StatusHub",
    description:
      "Monitor 48 cloud service statuses in real-time. Auto-refreshes every minute.",
  },
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
