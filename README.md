# StatusHub

A unified real-time status dashboard that monitors **48 tech services** across **14 categories** — including component-level data for **AWS (270 services)**, **Google Cloud (201 products)**, and **Azure (168 services)**.

Built with Next.js 16, React 19, TypeScript, and Tailwind CSS.

**Live:** [statushub.vercel.app](https://statushub.vercel.app)

---

## What It Does

StatusHub pulls live data from official provider APIs and shows you at a glance which services are operational, degraded, or experiencing outages — with full incident timelines and component-level breakdowns.

No more checking 6 different status pages during an outage.

---

## Features

- **Real-time monitoring** — 48 services polled every 3 minutes via Statuspage, AWS Health, GCP Status, and Azure Status APIs
- **Cloud provider deep integration** — AWS (270 services), Google Cloud (201 products), Azure (168 services) with real component-level data
- **Incident intelligence** — Three-way split (Active / Monitoring / Resolved), live duration timers, grouped severity sections
- **My Stack** — Star services, filter your view, share via URL (`?stack=github,vercel,stripe`)
- **Email & push notifications** — Granular alerts for outages, degradation, maintenance, and recovery with per-service rate limiting
- **3 themes** — Dark, Light, and Midnight with WCAG-compliant contrast
- **Keyboard shortcuts** — `Cmd/Ctrl+K` search, `Esc` close, arrow keys navigate
- **Sort & filter** — By status severity, name, or category with search and category pills
- **Compact view** — Dense card layout for power users
- **User accounts** — GitHub/Google OAuth via Supabase with cloud sync for preferences and stack
- **Fully responsive** — Optimized for desktop, tablet, and mobile
- **Accessible** — Keyboard navigation, aria-labels, focus indicators, `prefers-reduced-motion` support

---

## Services Monitored

| Category | Services |
|----------|----------|
| Cloud Providers | AWS (270), Google Cloud (201), Azure (168) |
| Version Control & CI/CD | GitHub, GitLab, Bitbucket, CircleCI |
| Cloud & Hosting | Vercel, Netlify, Heroku, Render, Railway, DigitalOcean |
| Databases | MongoDB Atlas, PlanetScale, Supabase |
| Payments | Stripe, Shopify |
| Communication | Twilio, SendGrid, Mailgun |
| Productivity | Slack, Zoom, Figma, Notion, Jira, Confluence |
| CDN & Performance | Cloudflare, Cloudinary, imgix |
| Monitoring | Datadog, New Relic, Sentry, PagerDuty |
| Auth & Identity | Auth0, Okta |
| AI & ML | OpenAI, Anthropic |
| Developer Tools | Postman, npm, Docker, HashiCorp, Linear |
| Search & Feature Flags | Algolia, LaunchDarkly |
| Support & CRM | Intercom, Zendesk, HubSpot |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) + React 19 |
| Language | TypeScript |
| Styling | Tailwind CSS 4 + theme system |
| Fonts | DM Sans + Space Mono via `next/font` |
| Auth | Supabase OAuth (GitHub, Google) |
| Email | Nodemailer with custom HTML templates |
| Data | Statuspage API, AWS Health API, GCP Status JSON, Azure HTML parsing |
| Caching | Server-side in-memory cache (2-min TTL) |
| Hosting | Vercel |

---

## Getting Started

```bash
git clone https://github.com/AnuragBhanderi/StatusHub.git
cd StatusHub/statushub
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The core dashboard works with zero configuration. For user accounts and notifications, add Supabase credentials to `.env.local`.

---

## Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/AnuragBhanderi/StatusHub/tree/main/statushub)

---

## Architecture

```
Client (React 19)
  ↓ polls every 3 min
/api/services → fetches 48 services in parallel (batched in groups of 10)
  ├── Statuspage API     → 45 services (standard /api/v2/summary.json)
  ├── AWS Health API     → 270 services (S3 catalog + Health events)
  ├── GCP Status API     → 201 products (products.json + incidents.json)
  └── Azure Status Page  → 168 services (HTML parsing with SVG indicators)
  ↓ cached server-side (2-min TTL)
Client renders grid → detail view → incident timeline
  ↓ on status change
/api/cron/check-status → email + push notifications
```

---

## Project Structure

```
src/
├── app/
│   ├── api/services/           # Status data endpoints
│   ├── api/cron/check-status/  # Notification trigger
│   ├── api/notifications/      # Alert preferences
│   ├── dashboard/              # Main dashboard
│   └── page.tsx                # Landing page
├── components/                 # 15 UI components
├── config/
│   ├── services.ts             # 48 service definitions
│   └── themes.ts               # 3 theme color systems
└── lib/
    ├── live-fetch.ts           # Multi-API fetcher
    ├── normalizer.ts           # Status/incident mapping
    └── user-context.tsx        # Preferences + auth context
```

---

## Roadmap

See [docs/SaaS-Roadmap.md](docs/SaaS-Roadmap.md) for the full phased plan and [docs/Feature-Spec.md](docs/Feature-Spec.md) for the detailed feature specification.

**Next up:** Uptime history, Slack/Discord webhooks, incident digest, team workspaces, public API.

---

## License

MIT
