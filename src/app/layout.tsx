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
  title: "StatusHub - Unified Tech Status Dashboard",
  description:
    "Monitor the real-time status of all your tech dependencies in one place. Track 40+ services including AWS, GitHub, Vercel, Stripe, and more.",
  keywords: [
    "status page",
    "service status",
    "uptime monitoring",
    "developer tools",
    "infrastructure monitoring",
  ],
  metadataBase: new URL("https://statushub.orphilia.com"),
  openGraph: {
    title: "StatusHub - Unified Tech Status Dashboard",
    description:
      "Monitor the real-time status of all your tech dependencies in one place. Track 40+ services including AWS, GitHub, Vercel, Stripe, and more.",
    url: "https://statushub.orphilia.com",
    siteName: "StatusHub",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "StatusHub - Unified Tech Status Dashboard",
    description:
      "Monitor 40+ tech service statuses in one dashboard. No signup required.",
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
