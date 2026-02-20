"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { use } from "react";

export default function ServicePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const router = useRouter();

  // Redirect to the dashboard with the service selected
  // The SPA-style navigation on the dashboard handles service detail views
  useEffect(() => {
    router.push(`/?service=${slug}`);
  }, [slug, router]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0c0c10",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#666",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      Redirecting...
    </div>
  );
}
