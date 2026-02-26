import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "StatusHub - Unified Tech Status Dashboard",
    short_name: "StatusHub",
    description:
      "Monitor the real-time status of 48+ cloud services including AWS, GitHub, Vercel, Stripe, and more.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#09090b",
    theme_color: "#6366f1",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
