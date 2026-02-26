import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { services } from "@/config/services";
import { fetchServiceDetailLive } from "@/lib/live-fetch";
import ServicePageContent from "./ServicePageContent";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return services.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const service = services.find((s) => s.slug === slug);
  if (!service) return {};

  const name = service.name;
  const category = service.category;

  return {
    title: `Is ${name} Down? ${name} Status - Real-Time | StatusHub`,
    description: `Check if ${name} is down right now. Real-time ${name} status, component health, active incidents, and outage history. Monitor ${name} (${category}) alongside 48 other cloud services on StatusHub.`,
    keywords: [
      `${name.toLowerCase()} status`,
      `is ${name.toLowerCase()} down`,
      `${name.toLowerCase()} outage`,
      `${name.toLowerCase()} down`,
      `${name.toLowerCase()} incidents`,
      `${name.toLowerCase()} uptime`,
      `${slug} status`,
    ],
    alternates: {
      canonical: `https://statushub.live/service/${slug}`,
    },
    openGraph: {
      title: `Is ${name} Down? ${name} Status | StatusHub`,
      description: `Real-time ${name} status and incidents. Check if ${name} is down right now. Monitor ${name} alongside 48+ cloud services.`,
      url: `/service/${slug}`,
      siteName: "StatusHub",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${name} Status - Real-Time | StatusHub`,
      description: `Is ${name} down? Check real-time status, incidents, and component health for ${name}.`,
    },
  };
}

export const revalidate = 60;

export default async function ServicePage({ params }: Props) {
  const { slug } = await params;
  const config = services.find((s) => s.slug === slug);
  if (!config) notFound();

  const detail = await fetchServiceDetailLive(slug);

  // Find related services in the same category
  const relatedServices = services
    .filter((s) => s.category === config.category && s.slug !== slug)
    .slice(0, 6);

  // Build FAQ data for this service
  const faqs = [
    {
      question: `Is ${config.name} down right now?`,
      answer: detail
        ? `${config.name} is currently ${formatStatus(detail.service.currentStatus).toLowerCase()}. StatusHub monitors ${config.name} in real-time and updates every 60 seconds.`
        : `Check the live status above to see if ${config.name} is currently experiencing issues. StatusHub monitors ${config.name} in real-time.`,
    },
    {
      question: `How do I check ${config.name} status?`,
      answer: `You can check ${config.name} status right here on StatusHub, which aggregates the official ${config.name} status page data in real-time. You can also visit the official status page at ${config.statusPageUrl}.`,
    },
    {
      question: `What should I do if ${config.name} is down?`,
      answer: `If ${config.name} is experiencing an outage: 1) Check the active incidents section above for details. 2) Visit the official status page for updates. 3) Use StatusHub's dashboard to monitor when ${config.name} recovers, alongside your other services.`,
    },
    {
      question: `How often is ${config.name} status updated?`,
      answer: `StatusHub checks ${config.name}'s official status page every 60 seconds and reflects the latest component health, active incidents, and overall status in real-time.`,
    },
  ];

  // JSON-LD structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "StatusHub",
            item: "https://statushub.live",
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Dashboard",
            item: "https://statushub.live/dashboard",
          },
          {
            "@type": "ListItem",
            position: 3,
            name: `${config.name} Status`,
            item: `https://statushub.live/service/${slug}`,
          },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: faqs.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: faq.answer,
          },
        })),
      },
      {
        "@type": "WebPage",
        "@id": `https://statushub.live/service/${slug}`,
        url: `https://statushub.live/service/${slug}`,
        name: `${config.name} Status - Real-Time | StatusHub`,
        description: `Real-time ${config.name} status, component health, and incident history.`,
        isPartOf: { "@id": "https://statushub.live/#website" },
        about: {
          "@type": "SoftwareApplication",
          name: config.name,
          applicationCategory: config.category,
          url: config.statusPageUrl,
        },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ServicePageContent
        config={config}
        detail={detail}
        faqs={faqs}
        relatedServices={relatedServices}
      />
    </>
  );
}

function formatStatus(status: string): string {
  switch (status) {
    case "OPERATIONAL":
      return "Operational";
    case "DEGRADED":
      return "Degraded Performance";
    case "PARTIAL_OUTAGE":
      return "Partial Outage";
    case "MAJOR_OUTAGE":
      return "Major Outage";
    case "MAINTENANCE":
      return "Under Maintenance";
    default:
      return "Unknown";
  }
}
