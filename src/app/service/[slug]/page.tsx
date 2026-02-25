import type { Metadata } from "next";
import { services } from "@/config/services";
import ServiceRedirect from "./ServiceRedirect";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const service = services.find((s) => s.slug === slug);
  const name = service?.name || slug;
  const category = service?.category || "Service";

  return {
    title: `${name} Status | StatusHub`,
    description: `Real-time status and incidents for ${name}. Monitor ${name} (${category}) alongside 48 other cloud services on StatusHub.`,
    openGraph: {
      title: `${name} Status | StatusHub`,
      description: `Real-time status and incidents for ${name}. Monitor ${name} (${category}) alongside 48 other cloud services on StatusHub.`,
      url: `/service/${slug}`,
      siteName: "StatusHub",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${name} Status | StatusHub`,
      description: `Real-time status and incidents for ${name} on StatusHub.`,
    },
  };
}

export default async function ServicePage({ params }: Props) {
  const { slug } = await params;
  return <ServiceRedirect slug={slug} />;
}
