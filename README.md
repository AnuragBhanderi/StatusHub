# StatusHub

A unified real-time status dashboard that monitors 44 tech services across 14 categories. Built with Next.js, TypeScript, and Tailwind CSS.

StatusHub pulls live data directly from official Statuspage APIs — no database required. It shows you at a glance which services are operational, degraded, or experiencing outages, with full incident timelines and component-level breakdowns.

## Features

- **Real-time monitoring** — Live status from 44 services via official Statuspage APIs, refreshed every 3 minutes
- **Service detail view** — Component health with progress ring, incident timeline with expandable updates
- **Smart component display** — Affected components surface to the top; operational ones collapse behind a summary
- **3 themes** — Dark, Light, and Midnight with smooth transitions and localStorage persistence
- **My Stack** — Star the services you care about, filter to see only your stack
- **Search & filter** — Search by name or category, filter by category pills
- **Error handling** — Retry button when API is unreachable, loading skeleton while fetching
- **Accessible** — Keyboard navigation, aria-labels, focus indicators, `prefers-reduced-motion` support

## Services Monitored

| Category | Services |
|----------|----------|
| Version Control & CI/CD | GitHub, GitLab, Bitbucket, CircleCI |
| Cloud & Hosting | Vercel, Netlify, Heroku, Render, Fly.io, Railway |
| Cloud Providers | AWS, Google Cloud, Microsoft Azure |
| Databases | MongoDB Atlas, PlanetScale, Supabase |
| Payments | Stripe, Square |
| Communication | Twilio, SendGrid, Postmark |
| Productivity | Atlassian, Notion, Linear, Figma, Miro, Loom |
| CDN & Performance | Cloudflare, Fastly, Akamai |
| Monitoring | Datadog, New Relic, PagerDuty, Sentry |
| Auth & Identity | Auth0, Okta |
| AI & ML | Anthropic, OpenAI |
| Developer Tools | npm, Docker, Terraform, JFrog, HashiCorp Vault |
| Search | Algolia, LaunchDarkly |
| Support & CRM | Zendesk, Intercom, HubSpot |

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + inline styles with theme system
- **Fonts:** DM Sans (body) + Space Mono (monospace) via `next/font`
- **Data:** Direct Statuspage API fetching with server-side in-memory cache (2-min TTL)
- **State:** React hooks with localStorage persistence

## Getting Started

```bash
# Clone the repo
git clone https://github.com/AnuragBhanderi/StatusHub.git
cd StatusHub/statushub

# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the dashboard.

## Project Structure

```
src/
├── app/
│   ├── api/services/          # API routes (list + detail)
│   ├── service/[slug]/        # Service redirect page
│   ├── globals.css            # Animations + reduced motion
│   ├── layout.tsx             # Root layout with fonts + SEO
│   └── page.tsx               # Main dashboard
├── components/
│   ├── CategoryPills.tsx      # Category filter pills
│   ├── LogoIcon.tsx           # Service logo with fallback
│   ├── MyStackToggle.tsx      # Stack filter toggle
│   ├── SearchBar.tsx          # Search input with clear button
│   ├── ServiceCard.tsx        # Service grid card
│   ├── ServiceDetailView.tsx  # Full service detail page
│   ├── StatusBanner.tsx       # Global status summary
│   ├── StatusDot.tsx          # Animated status indicator
│   └── ThemeSwitcher.tsx      # Theme dropdown
├── config/
│   ├── services.ts            # 44 service definitions
│   └── themes.ts              # 3 theme color systems
└── lib/
    ├── live-fetch.ts          # Statuspage API fetcher + cache
    └── normalizer.ts          # Status/incident type mapping
```

## How It Works

1. The `/api/services` route fetches all 44 services from their official Statuspage APIs in parallel (batched in groups of 10)
2. Results are cached server-side for 2 minutes to avoid hammering upstream APIs
3. The client polls this endpoint every 3 minutes
4. StatusHub detects a Statuspage quirk where `indicator: "none"` can coexist with active major incidents, and overrides the status accordingly

## Deploy

Deploy to Vercel with one click:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/AnuragBhanderi/StatusHub/tree/main/statushub)

Or build and run manually:

```bash
npm run build
npm start
```

## License

MIT
