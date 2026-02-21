# StatusHub

A unified real-time status dashboard that monitors 44 tech services across 14 categories. Built with Next.js, TypeScript, and Tailwind CSS.

StatusHub pulls live data directly from official Statuspage APIs — no database required. It shows you at a glance which services are operational, degraded, or experiencing outages, with full incident timelines and component-level breakdowns.

## Features

### Core
- **Real-time monitoring** — Live status from 44 services via official Statuspage APIs, refreshed every 3 minutes
- **Service detail view** — Component health with progress ring, incident timeline with expandable updates
- **Smart component display** — Affected components surface to the top; operational ones collapse behind a summary
- **3 themes** — Dark, Light, and Midnight with WCAG-compliant contrast, smooth transitions, and localStorage persistence
- **My Stack** — Star the services you care about, filter to see only your stack
- **Search & filter** — Search by name or category, filter by category pills
- **Error handling** — Retry button when API is unreachable, loading skeleton while fetching
- **Accessible** — Keyboard navigation, aria-labels, focus indicators, `prefers-reduced-motion` support

### Incident Intelligence
- **"Fix Deployed — Monitoring" category** — Services with monitoring-status incidents stay green instead of falsely showing as degraded. A dedicated teal section in the detail view shows what was recently fixed and is being watched.
- **Three-way incident split** — Detail view separates incidents into Active, Monitoring, and Resolved sections with distinct visual treatment
- **Grouped severity sections** — Home page organizes services into Issues (red), Monitoring (teal), and Operational (green) groups instead of a flat grid
- **Incident duration timer** — Live elapsed time on active incidents ("Ongoing for 2h 14m")

### UX Enhancements
- **Keyboard shortcuts** — `Cmd/Ctrl+K` to focus search, `Esc` to close detail view, arrow keys to navigate cards
- **Share service link** — Copy-to-clipboard button on the detail view header
- **Sort toggle** — Switch between sorting by status severity, name (A-Z), or category
- **Compact/dense view** — Smaller cards for power users monitoring many services, persisted to localStorage
- **Relative timestamp tooltips** — Hover over "2h ago" to see the full absolute timestamp

### Responsive & Visual
- **Fully responsive** — Tablet (768px) and mobile (480px) breakpoints with adapted layouts
- **WCAG color contrast** — All status colors darkened for 3.5:1+ contrast ratio on light backgrounds
- **Theme-aware logos** — Drop-shadow filter ensures white logos (GitHub, etc.) are visible on light backgrounds
- **Consistent card heights** — Flex layout ensures uniform card sizing across grid rows

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

## What's Been Built (beyond initial release)

| Feature | Description |
|---------|-------------|
| **"Fix Deployed — Monitoring" category** | Three-way incident split (Active / Monitoring / Resolved). Services with monitoring-only incidents stay green with a teal hint instead of falsely showing as degraded. |
| **Grouped severity sections** | Home page organizes services into Issues, Monitoring, and Operational groups with section headers instead of a flat grid. |
| **Keyboard shortcuts** | `Cmd/Ctrl+K` search focus, `Esc` close detail view, arrow key card navigation. |
| **Incident duration timer** | Live elapsed time on active incidents ("Ongoing for 2h 14m"). |
| **Share service link** | Copy-to-clipboard button on detail view header. |
| **Sort toggle** | Sort by severity, name (A-Z), or category. |
| **Compact/dense view** | Smaller cards for power users, persisted to localStorage. |
| **Relative timestamp tooltips** | Hover to see full absolute timestamp on all relative times. |
| **Responsive design** | Tablet (768px) and mobile (480px) breakpoints with adapted layouts, hidden labels, and stacked toolbars. |
| **WCAG color contrast** | All status colors darkened for 3.5:1+ contrast on light backgrounds. |
| **Theme-aware logos** | Drop-shadow filter for white logos on light theme. |
| **Theme contrast improvements** | Stronger borders, better text readability, and visible surfaces across all 3 themes. |

## Roadmap

Feature ideas for StatusHub, grouped by effort and categorized by whether they can be built with the current stack (Next.js + React + Statuspage APIs + localStorage) or require additional infrastructure.

### Implementable Now (no new dependencies)

These features work entirely with the existing tech stack — client-side React, server-side API routes, Statuspage APIs, and localStorage.

#### Quick Wins

| # | Feature | Status | Description |
|---|---------|--------|-------------|
| 1 | **Keyboard shortcuts** | Done | `Cmd/Ctrl+K` to focus search, `Esc` to close detail view, arrow keys to navigate the card grid. |
| 2 | **Incident duration timer** | Done | Live elapsed time on active incidents ("Ongoing for 2h 14m"). |
| 3 | **Share service link** | Done | Copy-to-clipboard button on the detail view header. |
| 4 | **Sort toggle** | Done | Switch between sorting by status severity, name (A-Z), or category. |
| 5 | **Compact/dense view toggle** | Done | Smaller cards for power users. Toggle persisted to localStorage. |
| 6 | **Relative timestamp tooltips** | Done | Hover over "2h ago" to see the full absolute timestamp. |

#### Medium Effort

| # | Feature | Status | Description |
|---|---------|--------|-------------|
| 7 | **Uptime history sparkline** | Planned | Store last N poll results in localStorage per service. Render a tiny 24h/7d sparkline on each card. |
| 8 | **Grouped category view** | Planned | Aggregate status per category with collapsible sections. Great for scanning 44+ services quickly. |
| 9 | **Maintenance schedule section** | Planned | Surface scheduled maintenance data from Statuspage API as "Upcoming Maintenance" in the detail view. |
| 10 | **Browser notifications** | Planned | Fire a browser Notification when a "My Stack" service changes status. No backend needed. |
| 11 | **Export/Import My Stack** | Planned | Export starred services as a shareable URL (`?stack=github,vercel,stripe`). Import from a teammate's link. |
| 12 | **Incident RSS feed endpoint** | Planned | New `/api/feed` route generating RSS/Atom XML of all active incidents. Consumable by Slack, Teams, or RSS readers. |
| 13 | **Service comparison view** | Planned | Select 2-3 services and view their component health and incidents side-by-side. |
| 14 | **Status page embed widget** | Planned | A `/api/embed/[slug]` endpoint returning SVG/HTML badge showing a service's current status. Embeddable in READMEs. |
| 15 | **Auto-refresh countdown** | Planned | Show a countdown timer ("Refreshing in 2:41") next to the "Live" indicator. |
| 16 | **Component dependency hints** | Planned | Manual config mapping (e.g., "Vercel depends on AWS"). Show "Upstream issue: AWS" note on dependent cards. |

#### Larger Features

| # | Feature | Status | Description |
|---|---------|--------|-------------|
| 17 | **Reliability scorecard** | Planned | Track incidents over time per service. Compute rolling 7d/30d uptime %, incident count, avg resolution time. Show as a "Reliability" tab. |
| 18 | **Custom status page builder** | Planned | Users pick services from their stack and generate a shareable `/status/[id]` page showing only those services. |
| 19 | **Cross-service incident timeline** | Planned | A "Timeline" view showing all active incidents across all services on a single horizontal timeline. |
| 20 | **AWS/GCP/Azure real data** | Planned | Implement dedicated parsers to extract region-level status from their RSS/JSON feeds. |
| 21 | **Grouped incident correlation** | Planned | When multiple services report incidents in the same time window, group them as "Possibly related." |

---

### Requires Additional Infrastructure

These features need a database, external service, or persistent backend beyond what the current stack provides.

#### Needs a Database (e.g., SQLite, Supabase, Postgres)

| # | Feature | Description | Why it needs infra |
|---|---------|-------------|-------------------|
| 22 | **Full uptime history** | Store every poll result to build accurate uptime percentages, MTTR metrics, and historical trend charts over weeks/months. | localStorage is per-browser and size-limited (~5MB). Long-term history needs persistent storage. |
| 23 | **Incident history archive** | Keep a permanent record of past incidents even after they drop off Statuspage's recent list. Enable searching and filtering old incidents. | Statuspage API only returns recent incidents. Historical data must be stored server-side. |
| 24 | **User accounts & cloud sync** | Sync "My Stack", theme, and preferences across devices. Login with GitHub/Google. | Needs auth provider + user data storage. |
| 25 | **Team dashboards** | Shared team status pages with role-based access, shared stack config, and team-wide notification preferences. | Multi-user state requires a database and auth. |
| 26 | **SLA tracking** | Define SLA targets per service (e.g., 99.9%), track actual uptime against them, and show breach alerts. | Computing SLA over time requires stored poll history. |

#### Needs External Services / APIs

| # | Feature | Description | Why it needs infra |
|---|---------|-------------|-------------------|
| 27 | **Slack/Discord webhook alerts** | Push real-time alerts to a Slack channel or Discord server when a starred service goes down or recovers. | Requires a persistent process (cron/worker) to detect changes and call external webhook URLs. |
| 28 | **Email notifications** | Send email digests (daily summary or instant alert) when services change status. | Needs an email service (SendGrid, Resend, etc.) and background job scheduler. |
| 29 | **SMS alerts** | Send SMS for critical outages on starred services. | Needs Twilio or similar SMS provider + background worker. |
| 30 | **Custom service monitoring** | Let users add their own URLs to monitor (HTTP health checks). | Needs a server-side scheduler to ping URLs periodically and store results. |
| 31 | **Public API with rate limiting** | Expose a documented public REST API (`/api/v1/services`, `/api/v1/incidents`) for third-party consumption with API keys and rate limits. | Rate limiting and API key management need persistent state and middleware. |

---

### Priority Recommendation (next up)

For maximum user value with zero infrastructure changes:

1. **Grouped category view** — Big usability win for 44+ services
2. **Maintenance schedule** — Free data from Statuspage API, just needs rendering
3. **Browser notifications** — Killer feature for "My Stack" users
4. **Uptime sparkline** — Visual history without a database
5. **Export/Import My Stack** — Team onboarding with shareable URLs
6. **Auto-refresh countdown** — Confirms data freshness without manual refresh

## License

MIT
