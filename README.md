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

## Roadmap

Feature ideas for StatusHub, grouped by effort and categorized by whether they can be built with the current stack (Next.js + React + Statuspage APIs + localStorage) or require additional infrastructure.

### Implementable Now (no new dependencies)

These features work entirely with the existing tech stack — client-side React, server-side API routes, Statuspage APIs, and localStorage.

#### Quick Wins

| # | Feature | Description |
|---|---------|-------------|
| 1 | **Keyboard shortcuts** | `Cmd/Ctrl+K` to focus search, `Esc` to close detail view, arrow keys to navigate the card grid. Pure client-side event listeners. |
| 2 | **Incident duration timer** | Show live elapsed time on active incidents ("Ongoing for 2h 14m"). Data already available via `startedAt` — just needs a computed display. |
| 3 | **Share service link** | Copy-to-clipboard button on the detail view header. The `/service/[slug]` redirect route already exists. |
| 4 | **Sort toggle** | Let users switch between sorting by status severity (current default), name (A-Z), or category. Add a small segmented control next to the search bar. |
| 5 | **Compact/dense view toggle** | Smaller cards with less padding for power users monitoring many services. Toggle persisted to localStorage alongside theme preference. |
| 6 | **Relative timestamp tooltips** | Hover over "2h ago" to see the full absolute timestamp. Improves clarity for incident timelines. |

#### Medium Effort

| # | Feature | Description |
|---|---------|-------------|
| 7 | **Uptime history sparkline** | Store last N poll results in localStorage per service. Render a tiny 24h/7d sparkline (row of colored ticks) on each card showing recent green/red history. No database needed. |
| 8 | **Grouped category view** | Aggregate status per category ("All 6 Cloud & Hosting services operational") with collapsible sections. Great for scanning 44+ services quickly. Uses existing `CATEGORIES` config. |
| 9 | **Maintenance schedule section** | Statuspage API returns scheduled maintenance data that we currently ignore. Surface it as "Upcoming Maintenance" in the service detail view. |
| 10 | **Browser notifications** | When a "My Stack" service changes status on the next poll, fire a browser `Notification`. Requires one-time permission prompt. No backend needed. |
| 11 | **Export/Import My Stack** | Export starred services as a JSON blob or shareable URL (`?stack=github,vercel,stripe`). Import from a teammate's link. Good for team onboarding. |
| 12 | **Incident RSS feed endpoint** | New `/api/feed` route generating an RSS/Atom XML feed of all active incidents across all services. Consumable by Slack, Teams, or any RSS reader. |
| 13 | **Service comparison view** | Select 2-3 services and view their component health and incidents side-by-side in a multi-column layout. |
| 14 | **Status page embed widget** | A `/api/embed/[slug]` endpoint returning a small SVG or HTML badge showing a service's current status. Embeddable in READMEs or dashboards. |
| 15 | **Auto-refresh countdown** | Show a small countdown timer ("Refreshing in 2:41") in the header next to the "Live" indicator. Gives users confidence data is fresh without manual refresh. |
| 16 | **Component dependency hints** | Manual config mapping (e.g., "Vercel depends on AWS"). When an upstream service has issues, show a subtle "Upstream issue: AWS" note on dependent service cards. |

#### Larger Features

| # | Feature | Description |
|---|---------|-------------|
| 17 | **Reliability scorecard** | Track incidents over time per service using localStorage. Compute rolling 7d/30d uptime %, incident count, average resolution time. Show as a "Reliability" tab in the detail view. |
| 18 | **Custom status page builder** | Users pick services from their stack and generate a shareable `/status/[id]` page showing only those services. Config stored as a URL-encoded param or localStorage entry. |
| 19 | **Cross-service incident timeline** | A dedicated "Timeline" view showing all active incidents across all services on a single horizontal timeline. Helps spot cascading outages and correlated failures. |
| 20 | **AWS/GCP/Azure real data** | These 3 cloud providers currently show static "OPERATIONAL" because they use RSS/JSON feeds instead of Statuspage. Implement dedicated parsers to extract region-level status from their feeds. |
| 21 | **Grouped incident correlation** | When multiple services report incidents within the same time window, automatically group them as "Possibly related" with a shared timeline view. |

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

### Priority Recommendation

For maximum user value with zero infrastructure changes:

1. **Keyboard shortcuts** — Immediate UX polish
2. **Incident duration timer** — Trivial to implement, high visibility
3. **Grouped category view** — Big usability win for 44+ services
4. **Maintenance schedule** — Free data from Statuspage API, just needs rendering
5. **Browser notifications** — Killer feature for "My Stack" users
6. **Uptime sparkline** — Visual history without a database

## License

MIT
