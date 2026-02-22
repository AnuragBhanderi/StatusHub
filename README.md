# StatusHub

A unified real-time status dashboard that monitors 48 tech services across 14 categories. Built with Next.js, TypeScript, and Tailwind CSS.

StatusHub pulls live data directly from official APIs — Statuspage, AWS Health, Google Cloud Status, and Azure Status — with no database required for the core dashboard. It shows you at a glance which services are operational, degraded, or experiencing outages, with full incident timelines and component-level breakdowns.

## Features

### Core
- **Real-time monitoring** — Live status from 48 services via official APIs (Statuspage, AWS Health, GCP Status, Azure HTML), refreshed every 3 minutes
- **Service detail view** — Component health with progress ring, incident timeline with expandable updates
- **Smart component display** — Affected components surface to the top; operational ones collapse behind a summary
- **Cloud provider deep integration** — AWS (270 services via S3 catalog + Health API), Google Cloud (201 products via products.json), Azure (168 services via HTML status page parsing)
- **3 themes** — Dark, Light, and Midnight with WCAG-compliant contrast, smooth transitions, and localStorage persistence
- **My Stack** — Star the services you care about, filter to see only your stack, share via URL (`?stack=github,vercel,stripe`)
- **Search & filter** — Search by name or category, filter by category pills
- **Error handling** — Retry button when API is unreachable, loading skeleton while fetching
- **Accessible** — Keyboard navigation, aria-labels, focus indicators, `prefers-reduced-motion` support
- **Email notifications** — Granular alerts for outages, degradation, maintenance, and recovery with per-service rate limiting
- **Browser push notifications** — Instant popup when a My Stack service changes status

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

## Services Monitored (48)

| Category | Services |
|----------|----------|
| Version Control & CI/CD | GitHub, GitLab, Bitbucket, CircleCI |
| Cloud & Hosting | Vercel, Netlify, Heroku, Render, Railway, DigitalOcean |
| Cloud Providers | AWS (270 sub-services), Google Cloud (201 products), Microsoft Azure (168 services) |
| Databases | MongoDB Atlas, PlanetScale, Supabase |
| Payments | Stripe, Shopify |
| Communication | Twilio, SendGrid, Mailgun |
| Productivity | Slack, Zoom, Figma, Notion, Jira, Confluence |
| CDN & Performance | Cloudflare, Cloudinary, imgix |
| Monitoring | Datadog, New Relic, Sentry, PagerDuty |
| Auth & Identity | Auth0, Okta |
| AI & ML | OpenAI, Anthropic |
| Developer Tools | Postman, npm, Docker, HashiCorp, Linear |
| Search | Algolia, LaunchDarkly |
| Support & CRM | Intercom, Zendesk, HubSpot |

## Tech Stack

- **Framework:** Next.js 16 (App Router) + React 19
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4 + inline styles with theme system
- **Fonts:** DM Sans (body) + Space Mono (monospace) via `next/font`
- **Data:** Direct API fetching (Statuspage, AWS Health, GCP Status, Azure HTML) with server-side in-memory cache (2-min TTL)
- **State:** React Context + localStorage persistence
- **Auth:** Supabase (optional — dashboard works without it)
- **Email:** Nodemailer with custom HTML templates
- **Hosting:** Vercel

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
│   ├── api/
│   │   ├── services/              # API routes (list + detail)
│   │   ├── cron/check-status/     # Status change detector + email sender
│   │   ├── notifications/         # Notification preferences + test email
│   │   └── preferences/           # User preference sync
│   ├── dashboard/                 # Main dashboard + loading skeleton
│   ├── service/[slug]/            # Service redirect page
│   ├── auth/callback/             # OAuth callback handler
│   ├── globals.css                # Animations + responsive breakpoints
│   ├── layout.tsx                 # Root layout with fonts + SEO
│   └── page.tsx                   # Landing page
├── components/
│   ├── AppHeader.tsx              # Sticky nav with theme switcher + auth
│   ├── AppFooter.tsx              # Shared footer
│   ├── CategoryPills.tsx          # Category filter pills
│   ├── LogoIcon.tsx               # Service logo with theme-aware fallback
│   ├── MyStackToggle.tsx          # Stack filter toggle
│   ├── NotificationBell.tsx       # Notification trigger button
│   ├── NotificationSettings.tsx   # Email/push notification preferences
│   ├── SearchBar.tsx              # Search input (Cmd+K aware)
│   ├── ServiceCard.tsx            # Service grid card
│   ├── ServiceDetailView.tsx      # Full service detail page
│   ├── StatusBanner.tsx           # Global status summary
│   ├── ThemeSwitcher.tsx          # Theme dropdown
│   ├── Toast.tsx                  # Toast notification system
│   ├── UserMenu.tsx               # Auth user menu
│   ├── LoadingState.tsx           # Skeleton loader
│   └── ErrorState.tsx             # Error state with retry
├── config/
│   ├── services.ts                # 48 service definitions
│   └── themes.ts                  # 3 theme color systems
└── lib/
    ├── live-fetch.ts              # Multi-API fetcher (Statuspage + AWS + GCP + Azure)
    ├── normalizer.ts              # Status/incident type mapping
    ├── user-context.tsx           # User preferences + auth context
    └── supabase/                  # Supabase client + middleware
```

## How It Works

1. The `/api/services` route fetches all 48 services from their official APIs in parallel (batched in groups of 10)
   - **Statuspage API** — 45 services via `/api/v2/summary.json` (standard Atlassian Statuspage format)
   - **AWS Health** — Service catalog from S3 (`services.json`, 270 services) + active events from Health API (`currentevents`, UTF-16 encoded)
   - **Google Cloud** — Product catalog (`products.json`, 201 products) + incidents (`incidents.json`) cross-referenced by product ID
   - **Azure** — Server-rendered HTML status page parsed for 168 services with per-region status via SVG indicators
2. Results are cached server-side for 2 minutes to avoid hammering upstream APIs
3. The client polls this endpoint every 3 minutes
4. StatusHub detects a Statuspage quirk where `indicator: "none"` can coexist with active major incidents, and overrides the status accordingly
5. A cron job (`/api/cron/check-status`) detects status changes and triggers email/push notifications for subscribed users

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
| **Sort toggle** | Sort by severity, name (A-Z), or category — persisted to localStorage. |
| **Compact/dense view** | Smaller cards for power users, persisted to localStorage. |
| **Relative timestamp tooltips** | Hover to see full absolute timestamp on all relative times. |
| **Responsive design** | Tablet (768px) and mobile (480px) breakpoints with adapted layouts, hidden labels, and stacked toolbars. |
| **WCAG color contrast** | All status colors darkened for 3.5:1+ contrast on light backgrounds. |
| **Theme-aware logos** | Light and dark drop-shadow filters ensuring logos are visible on all themes. |
| **Theme contrast improvements** | Stronger borders, better text readability, and visible surfaces across all 3 themes. |
| **Email notifications** | Granular email alerts for 5 event types (major outage, partial outage, degraded, maintenance, recovery) with per-service rate limiting (30 min cooldown), custom HTML templates, and unsubscribe headers. |
| **Browser push notifications** | Instant desktop notifications when a My Stack service changes status. |
| **Landing page** | Marketing site with hero, feature showcase, live status preview, pricing, and testimonials. |
| **User auth** | Supabase OAuth (GitHub/Google) with cloud sync for preferences and stack. |
| **Shared AppHeader/AppFooter** | Consistent navigation and footer across all pages. |
| **Dashboard loading skeleton** | App Router `loading.tsx` for instant perceived loading before JS hydration. |
| **AWS/GCP/Azure real data** | Dedicated parsers fetching real component-level data: AWS (270 services from S3 catalog + Health API), Google Cloud (201 products cross-referenced with incidents), Azure (168 services parsed from HTML status page). |
| **My Stack sharing** | Export/import starred services via URL (`?stack=github,vercel,stripe`). |
| **Scroll-to-top on transitions** | Smooth scroll to top when navigating between grid and detail views. |

## Roadmap

Feature ideas for StatusHub, grouped by effort and status.

### Implementable Now (no new dependencies)

#### Quick Wins (all done)

| # | Feature | Status | Description |
|---|---------|--------|-------------|
| 1 | **Keyboard shortcuts** | Done | `Cmd/Ctrl+K` to focus search, `Esc` to close detail view, arrow keys to navigate the card grid. |
| 2 | **Incident duration timer** | Done | Live elapsed time on active incidents ("Ongoing for 2h 14m"). |
| 3 | **Share service link** | Done | Copy-to-clipboard button on the detail view header. |
| 4 | **Sort toggle** | Done | Switch between sorting by status severity, name (A-Z), or category. Persisted to localStorage. |
| 5 | **Compact/dense view toggle** | Done | Smaller cards for power users. Toggle persisted to localStorage. |
| 6 | **Relative timestamp tooltips** | Done | Hover over "2h ago" to see the full absolute timestamp. |

#### Medium Effort

| # | Feature | Status | Description |
|---|---------|--------|-------------|
| 7 | **Uptime history sparkline** | Planned | Store last N poll results in localStorage per service. Render a tiny 24h/7d sparkline on each card showing uptime over time. |
| 8 | **Grouped category view** | Planned | Aggregate status per category with collapsible sections. Great for scanning 48+ services quickly. |
| 9 | **Maintenance schedule section** | Planned | Surface scheduled maintenance data from Statuspage API as "Upcoming Maintenance" in the detail view. |
| 10 | **Browser notifications** | Done | Instant desktop notifications when a My Stack service changes status. |
| 11 | **Export/Import My Stack** | Done | Shareable URL (`?stack=github,vercel,stripe`). Import from a teammate's link. |
| 12 | **Incident RSS feed endpoint** | Planned | New `/api/feed` route generating RSS/Atom XML of all active incidents. Consumable by Slack, Teams, or RSS readers. |
| 13 | **Service comparison view** | Planned | Select 2-3 services and view their component health and incidents side-by-side. |
| 14 | **Status page embed widget** | Planned | A `/api/embed/[slug]` endpoint returning SVG/HTML badge showing a service's current status. Embeddable in READMEs. |
| 15 | **Auto-refresh countdown** | Planned | Show a visible countdown timer ("Refreshing in 2:41") next to the "Live" indicator so users know data is live. |
| 16 | **Component dependency hints** | Planned | Manual config mapping (e.g., "Vercel depends on AWS"). Show "Upstream issue: AWS" note on dependent cards. |
| 17 | **Status filter buttons** | Planned | Filter dashboard by status (show only degraded/outage services). Currently only category filtering exists. |

#### Larger Features

| # | Feature | Status | Description |
|---|---------|--------|-------------|
| 18 | **Reliability scorecard** | Planned | Track incidents over time per service. Compute rolling 7d/30d uptime %, incident count, avg resolution time. Show as a "Reliability" tab. |
| 19 | **Custom status page builder** | Planned | Users pick services from their stack and generate a shareable `/status/[id]` page showing only those services. |
| 20 | **Cross-service incident timeline** | Planned | A "Timeline" view showing all active incidents across all services on a single horizontal timeline. |
| 21 | **AWS/GCP/Azure real data** | Done | Dedicated parsers for AWS (270 services via S3 catalog + Health API), Google Cloud (201 products via products.json), Azure (168 services via HTML parsing). |
| 22 | **Grouped incident correlation** | Planned | When multiple services report incidents in the same time window, group them as "Possibly related." |

---

### Requires Additional Infrastructure

#### Needs a Database (Supabase already integrated)

| # | Feature | Status | Description |
|---|---------|--------|-------------|
| 23 | **Full uptime history** | Planned | Store every poll result to build accurate uptime percentages, MTTR metrics, and historical trend charts over weeks/months. The killer feature for a status dashboard — "99.98% uptime last 30 days." |
| 24 | **Incident history archive** | Planned | Keep a permanent record of past incidents even after they drop off Statuspage's recent list. Enable searching and filtering old incidents. |
| 25 | **User accounts & cloud sync** | Done | Supabase OAuth (GitHub/Google) with cloud sync for preferences and stack. |
| 26 | **Team dashboards** | Planned | Shared team status pages with role-based access, shared stack config, and team-wide notification preferences. |
| 27 | **SLA tracking** | Planned | Define SLA targets per service (e.g., 99.9%), track actual uptime against them, and show breach alerts. |
| 28 | **Notification history** | Planned | Show a log of past alerts ("GitHub had a major outage 3 days ago, you were notified"). Viewable in the dashboard. |

#### Needs External Services / APIs

| # | Feature | Status | Description |
|---|---------|--------|-------------|
| 29 | **Slack/Discord webhook alerts** | Planned | Push real-time alerts to a Slack channel or Discord server when a starred service goes down or recovers. |
| 30 | **Email notifications** | Done | Granular email alerts for 5 event types with per-service rate limiting, custom HTML templates, and unsubscribe headers. |
| 31 | **SMS alerts** | Planned | Send SMS for critical outages on starred services. Needs Twilio or similar. |
| 32 | **Custom service monitoring** | Planned | Let users add their own internal URLs to monitor (HTTP health checks). Needs server-side scheduler. |
| 33 | **Public API with rate limiting** | Planned | Expose a documented REST API (`/api/v1/services`, `/api/v1/incidents`) with API keys and rate limits. |
| 34 | **Real-time updates via SSE** | Planned | Replace 3-minute polling with Server-Sent Events for instant incident notifications. |

#### Polish & Hardening

| # | Feature | Status | Description |
|---|---------|--------|-------------|
| 35 | **PWA support** | Planned | `manifest.json` + service worker so users can install the app and get push notifications even when the browser is closed. |
| 36 | **Error boundaries** | Planned | Wrap key sections so a single component crash doesn't take down the whole page. Add Sentry for error tracking. |
| 37 | **Accessibility pass** | Planned | Focus traps on modals, proper heading hierarchy, status indicators that don't rely only on color (icons/text for colorblind users). |
| 38 | **SEO & Open Graph** | Planned | `generateMetadata()` for dynamic service pages, OG images, Twitter cards, sitemap.xml, structured JSON-LD. |
| 39 | **Tests** | Planned | Unit tests for normalizer/live-fetch, integration tests for the dashboard, E2E tests with Playwright. |
| 40 | **Component splitting** | Planned | Break up large files (ServiceDetailView, dashboard page) into smaller, focused sub-components. |

---

### Priority Recommendation (next up)

**High Impact, Quick Wins:**

1. **Uptime history sparklines** (#7) — 24h/7d mini bar charts on each card. The #1 thing that makes a status dashboard feel "real."
2. **Status filter buttons** (#17) — Let users filter by status (show only degraded/outage services).
3. **Auto-refresh countdown** (#15) — Visible timer so users know data is live.
4. **SEO & Open Graph** (#38) — Dynamic metadata for organic traffic.

**Medium Effort, High Value:**

5. **Full uptime history** (#23) — Store snapshots in Supabase, show "99.98% uptime last 30 days." Killer feature.
6. **Real-time updates via SSE** (#34) — Replace polling with instant notifications.
7. **PWA support** (#35) — Installable app with offline support.
8. **Notification history** (#28) — Log of past alerts.

## License

MIT
