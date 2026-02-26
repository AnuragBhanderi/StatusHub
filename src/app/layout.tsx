import type { Metadata } from "next";
import { DM_Sans, Space_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { UserProvider } from "@/lib/user-context";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const spaceMono = Space_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "StatusHub - Real-Time Status Dashboard for 48+ Cloud Services",
  description:
    "Monitor the real-time status of AWS, GitHub, Vercel, Stripe, OpenAI, Slack, and 42 more cloud services in one unified dashboard. Free, no signup required. Instant outage detection.",
  keywords: [
    "status page",
    "service status",
    "uptime monitoring",
    "developer tools",
    "infrastructure monitoring",
    "is github down",
    "is aws down",
    "cloud service status",
    "status page aggregator",
    "uptime dashboard",
    "github status",
    "aws status",
    "vercel status",
    "stripe status",
    "openai status",
    "slack status",
    "downtime alerts",
    "service outage",
    "devops monitoring",
    "cloud status dashboard",
  ],
  metadataBase: new URL("https://statushub.live"),
  applicationName: "StatusHub",
  category: "Technology",
  creator: "StatusHub",
  publisher: "StatusHub",
  alternates: {
    canonical: "https://statushub.live",
  },
  openGraph: {
    title: "StatusHub - Real-Time Status Dashboard for 48+ Cloud Services",
    description:
      "Monitor AWS, GitHub, Vercel, Stripe, OpenAI, and 43 more services in one dashboard. Free, no signup required.",
    url: "https://statushub.live",
    siteName: "StatusHub",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "StatusHub - Real-Time Status Dashboard for 48+ Cloud Services",
    description:
      "Monitor 48+ cloud service statuses in one dashboard. AWS, GitHub, Stripe, OpenAI and more. Free, no signup.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://www.githubstatus.com" />
        <link rel="dns-prefetch" href="https://status.cloud.google.com" />
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-K7NB1RF19N" />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-K7NB1RF19N');`,
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("statushub_theme")||"dark";var m={"dark":"#09090b","light":"#fafafa","midnight":"#04040a"};document.documentElement.style.background=m[t]||m.dark;document.documentElement.style.colorScheme=t==="light"?"light":"dark"}catch(e){}})()`,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "Organization",
                  "@id": "https://statushub.live/#organization",
                  name: "StatusHub",
                  url: "https://statushub.live",
                  logo: "https://statushub.live/icon.svg",
                  description:
                    "StatusHub monitors the real-time status of 48+ cloud services in one unified dashboard.",
                },
                {
                  "@type": "WebSite",
                  "@id": "https://statushub.live/#website",
                  url: "https://statushub.live",
                  name: "StatusHub",
                  publisher: {
                    "@id": "https://statushub.live/#organization",
                  },
                  description:
                    "Real-time status monitoring for AWS, GitHub, Vercel, Stripe, OpenAI, and 43 more cloud services.",
                },
                {
                  "@type": "SoftwareApplication",
                  "@id": "https://statushub.live/#app",
                  name: "StatusHub",
                  url: "https://statushub.live",
                  applicationCategory: "DeveloperApplication",
                  operatingSystem: "Web",
                  offers: {
                    "@type": "Offer",
                    price: "0",
                    priceCurrency: "USD",
                  },
                  description:
                    "Free unified dashboard to monitor the real-time status of 48+ cloud services. No signup required.",
                },
              ],
            }),
          }}
        />
      </head>
      <body className={`${dmSans.variable} ${spaceMono.variable} antialiased`}>
        <UserProvider>
          {children}
        </UserProvider>
        <Analytics />
      </body>
    </html>
  );
}
