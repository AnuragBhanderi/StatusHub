import type { MetadataRoute } from "next";
import { services } from "@/config/services";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://statushub.live";
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/dashboard`,
      lastModified: now,
      changeFrequency: "always",
      priority: 0.9,
    },
  ];

  const servicePages: MetadataRoute.Sitemap = services.map((service) => ({
    url: `${baseUrl}/service/${service.slug}`,
    lastModified: now,
    changeFrequency: "always" as const,
    priority: 0.8,
  }));

  return [...staticPages, ...servicePages];
}
