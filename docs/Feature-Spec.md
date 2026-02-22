# StatusHub — Feature Specification

Comprehensive feature list organized by user tier and audience. Each feature includes a description, what it solves, and implementation scope.

---

## Tier Overview

| Tier | Audience | Price | Core Value |
|------|----------|-------|------------|
| **Free** | Individual developers | $0 | Monitor your tech stack, get basic alerts |
| **Pro** | Individual developers & freelancers | $9/mo | Unlimited stack, full alerts, history, analytics |
| **Team** | Engineering teams (5+ people) | $49/mo | Shared workspace, SLA tracking, integrations |
| **Enterprise** | Large orgs (50+ people) | Custom | SSO, custom monitoring, API access, dedicated support |

---

## Individual — Free Tier

Features available to all users without an account or on the free plan.

### Currently Built

| # | Feature | Description | Status |
|---|---------|-------------|--------|
| F1 | **Real-time status dashboard** | Live status monitoring of 48 cloud services across 14 categories (Version Control, Cloud Providers, Databases, Payments, Communication, etc.). Data refreshed every 3 minutes from official APIs. Shows services grouped into Issues, Monitoring, and Operational sections. | Done |
| F2 | **Service detail view** | Click any service card to see component-level health breakdown, active incidents with live duration timers, full incident timeline with expandable updates, and resolution history. Cloud providers show real sub-service data (AWS: 270, GCP: 201, Azure: 168). | Done |
| F3 | **My Stack (up to 10 services)** | Star up to 10 services to create a personal watchlist. Toggle "My Stack" to filter the dashboard to only your starred services. Stars persist in localStorage for anonymous users. | Done |
| F4 | **Search & category filtering** | Search services by name with `Cmd/Ctrl+K` shortcut. Filter by category using horizontal pill buttons (14 categories). Combine search + category for precise filtering. | Done |
| F5 | **3 themes** | Dark, Light, and Midnight themes with WCAG-compliant contrast ratios. Theme persists to localStorage. Smooth transitions between themes. All service logos have theme-aware drop-shadows for visibility. | Done |
| F6 | **Sort & compact view** | Sort services by status severity (issues first), name (A-Z), or category. Toggle compact/dense card layout for power users monitoring many services. Both preferences persist to localStorage. | Done |
| F7 | **Keyboard navigation** | Full keyboard support — `Cmd/Ctrl+K` to search, `Esc` to close views, arrow keys to navigate cards, `Enter/Space` to open, `Tab` through interactive elements. | Done |
| F8 | **Share service link** | Copy a direct link to any service's detail view. Share with teammates to point them at a specific service's status. | Done |
| F9 | **My Stack sharing** | Export your starred services as a shareable URL (`?stack=github,vercel,stripe`). Send the link to a teammate — they open it and instantly see your stack. | Done |
| F10 | **Responsive design** | Fully responsive at tablet (768px) and mobile (480px) breakpoints. Adapted card grids, stacked toolbars, overflow-safe header controls, touch-friendly targets. | Done |
| F11 | **Incident intelligence** | Three-way incident classification: Active (red), Fix Deployed/Monitoring (teal), and Resolved (green). Services in "monitoring" state stay green instead of falsely showing degraded. Live duration timers on active incidents. | Done |

### Planned for Free Tier

| # | Feature | Description | Effort |
|---|---------|-------------|--------|
| F12 | **Auto-refresh countdown** | Display a visible countdown timer ("Refreshing in 2:34") next to the "Live" indicator. Lets users know exactly when fresh data is coming without manually refreshing. Builds trust that the dashboard is actually live. | Small |
| F13 | **Status filter buttons** | Add filter buttons above the service grid to show only services with a specific status — "Show Issues Only", "Show Degraded", "Show Maintenance". Currently you can only filter by category, not by status. Helps during incidents when you want to see just what's broken. | Small |
| F14 | **Uptime sparklines (24h)** | Render a tiny 24-hour bar chart on each service card showing recent uptime history. Stores the last N poll results in localStorage (no account needed). Gives at-a-glance context — "this service has been flaky all day" vs "this just went down." The #1 visual feature that makes a status dashboard feel real. | Medium |
| F15 | **Grouped category view** | Aggregate service status per category with collapsible sections. Instead of scanning 48 individual cards, see "Cloud Providers: 3/3 Operational" as a summary row that expands on click. Great for large service counts. | Medium |
| F16 | **Maintenance schedule section** | Surface scheduled maintenance data from service APIs and show an "Upcoming Maintenance" section in the service detail view. Statuspage APIs already include this data — just needs rendering. Helps teams plan around vendor maintenance windows. | Medium |
| F17 | **Incident RSS feed** | New `/api/feed` endpoint generating RSS/Atom XML of all active incidents across all services. Subscribe from Slack, Microsoft Teams, RSS readers, or any tool that consumes RSS. Free, public, no auth required. | Medium |
| F18 | **Status page embed widget** | A `/api/embed/[slug]` endpoint that returns an SVG or HTML badge showing a service's current status (green/yellow/red with label). Embeddable in GitHub READMEs, Notion pages, internal wikis, or dashboards. Example: `![GitHub Status](statushub.app/api/embed/github)` | Medium |
| F19 | **PWA support** | Add `manifest.json` and a service worker so the dashboard is installable as a Progressive Web App on desktop and mobile. Users can add StatusHub to their home screen and open it like a native app. Enables offline caching of the last-known status. | Medium |
| F20 | **Accessibility improvements** | Focus trap on modals (NotificationSettings), proper heading hierarchy (h1/h2/h3), status indicators that don't rely solely on color (add icons and text labels for colorblind users), `<time>` elements for all timestamps, and ARIA live regions for status updates. | Medium |
| F21 | **SEO & Open Graph** | Dynamic `generateMetadata()` for service detail pages (title: "GitHub Status — StatusHub"), Open Graph images for social sharing, Twitter Card tags, sitemap.xml, robots.txt, and structured JSON-LD (schema.org) for search engines. Drives organic traffic. | Small |

---

## Individual — Pro Tier ($9/mo)

Everything in Free, plus features that require an account and persistent storage.

### Currently Built

| # | Feature | Description | Status |
|---|---------|-------------|--------|
| P1 | **User accounts & cloud sync** | Sign in with GitHub or Google via Supabase OAuth. Starred services, theme, sort preference, compact mode, and notification settings sync across all devices. Never lose your configuration when switching browsers or computers. | Done |
| P2 | **Unlimited My Stack** | Remove the 10-service cap. Star as many of the 48+ services as you want. Pro users can monitor their entire tech stack, not just the top 10. | Done |
| P3 | **Email notifications** | Granular email alerts for 5 event types: Major Outage, Partial Outage, Degraded Performance, Maintenance, and Recovery. Each event type can be independently enabled/disabled. Per-service rate limiting (1 email per service per 30 minutes) prevents inbox flooding. Custom HTML email templates with incident details, timelines, and one-click links to the dashboard. Includes email unsubscribe headers for compliance. | Done |
| P4 | **Browser push notifications** | Instant desktop push notifications when any My Stack service changes status. No need to keep the tab open — notifications appear system-wide. Configurable per event type (same 5 types as email). | Done |

### Planned for Pro Tier

| # | Feature | Description | Effort |
|---|---------|-------------|--------|
| P5 | **Full uptime history (7d/30d/90d)** | Store every status poll result in Supabase to build accurate uptime percentages over time. Show "99.98% uptime last 30 days" per service with a historical trend chart. Compute MTTR (Mean Time To Resolve) and incident frequency metrics. This is the killer feature for a status dashboard — transforms it from "what's happening now" to "how reliable is this service over time." | Large |
| P6 | **Uptime sparklines (7d/30d)** | Extended sparklines beyond the free 24h localStorage version. Pro users see 7-day and 30-day uptime bar charts on service cards, powered by stored history data. Instantly spot services with recurring issues. | Medium |
| P7 | **Reliability scorecard** | A dedicated "Reliability" tab in the service detail view showing: rolling uptime % (7d/30d/90d), total incident count, average resolution time, longest outage, and a reliability grade (A+ through F). Helps evaluate vendor reliability for architecture decisions. | Large |
| P8 | **Incident history archive** | Permanent record of all past incidents, even after they drop off the vendor's Statuspage API (which only shows recent ones). Search and filter old incidents by date, severity, and service. Answer questions like "how many times did AWS go down last quarter?" | Medium |
| P9 | **Notification history** | View a log of all past notifications you've received: "GitHub had a major outage 3 days ago — you were notified at 2:34 PM." See delivery status, click through to the incident. Useful for post-incident reviews and proving SLA compliance. | Medium |
| P10 | **Incident digest emails** | Daily or weekly summary email listing all incidents that affected your My Stack services in that period. Configurable frequency (daily at 9 AM, or weekly on Mondays). Great for managers who don't need real-time alerts but want a regular report. | Medium |
| P11 | **Service comparison view** | Select 2-3 services and view their component health, active incidents, and uptime history side-by-side in a split-pane layout. Useful when evaluating competing services (e.g., Vercel vs Netlify vs Render) or diagnosing correlated outages. | Medium |
| P12 | **Custom alert thresholds** | Configure per-service alert rules beyond the default severity toggles. Examples: "Only alert me if AWS is down for more than 5 minutes," "Alert on GitHub degradation but not maintenance," "Suppress alerts between 11 PM–7 AM." Reduces notification fatigue for services with frequent minor issues. | Medium |
| P13 | **Real-time updates via SSE** | Replace the 3-minute polling cycle with Server-Sent Events for instant incident notifications. When a service status changes, the dashboard updates within seconds instead of waiting for the next poll. Pro users see incidents the moment they happen. | Large |
| P14 | **Component dependency mapping** | Define dependencies between services (e.g., "Vercel depends on AWS," "My app depends on Stripe + Supabase"). When an upstream service goes down, dependent services show a banner: "Upstream issue: AWS is experiencing a partial outage." Helps teams instantly understand blast radius during incidents. | Large |
| P15 | **Cross-service incident timeline** | A "Timeline" view showing all active and recent incidents across all services on a single horizontal timeline. Visualize incident correlation — when two services have incidents at the same time, it's immediately visible. Filter by My Stack services or all services. | Large |
| P16 | **AI incident summaries** | LLM-powered plain-English summaries of verbose vendor incident updates. Instead of reading 5 paragraphs of technical jargon from AWS, see: "AWS S3 in us-east-1 is experiencing intermittent 503 errors. 40% of requests affected. Fix deployed, monitoring." Makes incidents accessible to non-technical stakeholders. | Large |

---

## Team Tier ($49/mo, 5 seats included)

Everything in Pro, plus collaboration and team-specific features.

### Planned Features

| # | Feature | Description | Effort |
|---|---------|-------------|--------|
| T1 | **Team workspaces** | Create a team workspace and invite teammates by email. Each workspace has a shared service stack, shared notification channels, and a unified dashboard. Team members see the same set of monitored services without each person configuring individually. Invite link or email-based onboarding. | Large |
| T2 | **Role-based access** | Three roles within a team workspace: **Admin** (manages stack, billing, integrations, invites), **Member** (views dashboard, receives alerts, can star personal favorites on top of team stack), **Viewer** (read-only dashboard access, no alert configuration). Prevents accidental changes to team-critical monitoring configuration. | Large |
| T3 | **Shared alert channels** | Configure team-wide notification channels — a shared Slack channel, Discord webhook, or email group. When any team stack service goes down, the entire team gets notified through the shared channel. Individual members can still have personal alert preferences on top of team alerts. | Medium |
| T4 | **Slack integration** | Connect a Slack workspace to your StatusHub team. Choose a channel for alerts. Get rich Slack messages with service name, status change, incident title, duration, and a "View in StatusHub" button. Support for Slack slash commands: `/statushub status` to check current status, `/statushub stack` to see team stack. | Large |
| T5 | **Discord integration** | Same as Slack integration but for Discord servers. Rich embed messages with color-coded status, incident details, and dashboard links. Configure which Discord channel receives alerts. | Medium |
| T6 | **SLA tracking** | Define uptime SLA targets per service (e.g., "AWS must be 99.9% uptime"). StatusHub tracks actual uptime against targets and shows: current SLA compliance %, remaining error budget (minutes of allowed downtime), breach alerts when a service drops below its target. Essential for teams with SLA commitments to their customers. | Large |
| T7 | **Maintenance calendar** | Aggregated calendar view of upcoming vendor maintenance windows across all team stack services. See which services have scheduled maintenance next week. Get advance email/Slack notifications before maintenance starts. Plan deployments and releases around vendor maintenance windows. | Medium |
| T8 | **Incident correlation** | Auto-detect when multiple services report incidents in the same time window and group them as "Possibly related." If AWS, Vercel, and Netlify all go down within 10 minutes, StatusHub flags it as a correlated event. Helps teams quickly understand if it's a cascading failure vs independent incidents. Show correlation confidence score and affected dependency chains. | Large |
| T9 | **Team activity log** | Audit trail of all team actions: who changed the stack, who modified alert channels, when SLA targets were updated, who acknowledged an incident. Useful for compliance, post-incident reviews, and team accountability. | Medium |
| T10 | **Custom status page builder** | Teams create a branded public status page (`statushub.app/status/[company]`) showing the status of their upstream dependencies. Embed on internal wikis, share with customers, or use as an internal engineering status board. Customizable logo, colors, and which services to include. Auto-updates from StatusHub data. | Large |
| T11 | **Scheduled reports** | Automated weekly or monthly reliability report emailed to the team or exported as PDF. Includes: uptime percentages per service, total incidents, MTTR trends, SLA compliance, and comparison to previous period. Ready-to-share with management or stakeholders. | Medium |

---

## Enterprise Tier (Custom Pricing)

Everything in Team, plus enterprise-grade features for large organizations.

### Planned Features

| # | Feature | Description | Effort |
|---|---------|-------------|--------|
| E1 | **SSO/SAML authentication** | Single Sign-On via SAML 2.0 or OpenID Connect. Integrate with Okta, Azure AD, Google Workspace, or any SAML-compatible identity provider. Enforce corporate authentication policies. Auto-provision and de-provision team members from your IdP. | Large |
| E2 | **Custom service monitoring** | Add your own internal URLs and endpoints to monitor alongside third-party services. StatusHub performs HTTP health checks every 1-5 minutes and tracks uptime, response time, and SSL certificate expiry. Monitor internal APIs, microservices, databases, and any URL you care about — all in the same dashboard as your vendor services. | Large |
| E3 | **Public API with rate limiting** | Documented REST API (`/api/v1/services`, `/api/v1/incidents`, `/api/v1/uptime`) with API key authentication and configurable rate limits. Integrate StatusHub data into internal tools, runbooks, Grafana dashboards, or custom alerting pipelines. OpenAPI/Swagger specification included. | Large |
| E4 | **Outbound webhooks** | Configure webhook URLs that receive POST requests when service status changes. Use for automated runbooks — e.g., when AWS goes down, automatically create a Jira ticket, page the on-call engineer via PagerDuty, or trigger a failover script. Configurable per service and severity level. Includes retry logic and delivery logs. | Large |
| E5 | **Jira/PagerDuty/OpsGenie integration** | Auto-create Jira tickets when upstream services go down. Page on-call engineers via PagerDuty or OpsGenie when critical dependencies fail. Two-way sync — when the Jira ticket is resolved, StatusHub updates the incident status. Native integrations, not just webhooks. | Large |
| E6 | **Multi-workspace management** | Manage multiple team workspaces from a single admin console. Useful for organizations with separate engineering teams (Backend, Frontend, Platform, SRE) that each monitor different service stacks. Global admin can view all workspaces, enforce policies, and manage billing centrally. | Large |
| E7 | **Advanced analytics & reporting** | Extended analytics beyond Pro/Team tier: service reliability trends over 6-12 months, MTTR benchmarking against industry averages, incident categorization (infrastructure vs application vs third-party), cost-of-downtime estimation, and executive-ready PDF reports. Data export to CSV/JSON for custom analysis. | Large |
| E8 | **Data retention & compliance** | Configurable data retention policies (30 days to unlimited). GDPR-compliant data handling with data export and deletion on request. SOC 2 audit trail support. Data residency options (US, EU, APAC). | Large |
| E9 | **Priority support & SLA** | Dedicated support channel (email/Slack), guaranteed response times (< 4 hours for critical issues), and a named account manager. Custom onboarding for large teams. | Ongoing |
| E10 | **SMS alerts** | SMS notifications for critical outages via Twilio or similar provider. Configurable per service and severity — typically reserved for "the entire platform is down" scenarios. Useful for on-call engineers who may not be at their desk. | Medium |

---

## Feature Comparison Matrix

| Feature | Free | Pro ($9/mo) | Team ($49/mo) | Enterprise |
|---------|------|-------------|---------------|------------|
| Real-time dashboard (48 services) | Yes | Yes | Yes | Yes |
| Service detail + components | Yes | Yes | Yes | Yes |
| Search, filter, sort | Yes | Yes | Yes | Yes |
| 3 themes + responsive design | Yes | Yes | Yes | Yes |
| Keyboard shortcuts | Yes | Yes | Yes | Yes |
| My Stack | 10 services | Unlimited | Unlimited | Unlimited |
| My Stack sharing (URL) | Yes | Yes | Yes | Yes |
| Uptime sparklines | 24h (local) | 7d/30d (stored) | 7d/30d (stored) | 7d/30d (stored) |
| Cloud sync (cross-device) | No | Yes | Yes | Yes |
| Email notifications | No | Yes (5 types) | Yes + team channel | Yes + SMS |
| Browser push notifications | No | Yes | Yes | Yes |
| Notification history | No | Yes | Yes | Yes |
| Incident digest emails | No | Yes | Yes | Yes |
| Full uptime history | No | 90 days | 90 days | Custom retention |
| Reliability scorecard | No | Yes | Yes | Yes |
| Incident archive | No | Yes | Yes | Yes |
| Service comparison | No | Yes | Yes | Yes |
| AI incident summaries | No | Yes | Yes | Yes |
| Real-time updates (SSE) | No | Yes | Yes | Yes |
| Dependency mapping | No | Yes | Yes | Yes |
| Team workspace | No | No | Yes (5 seats) | Yes (unlimited) |
| Role-based access | No | No | Yes | Yes |
| Slack/Discord integration | No | No | Yes | Yes |
| SLA tracking | No | No | Yes | Yes |
| Maintenance calendar | No | No | Yes | Yes |
| Incident correlation | No | No | Yes | Yes |
| Custom status page | No | No | Yes | Yes |
| Scheduled reports | No | No | Yes | Yes |
| SSO/SAML | No | No | No | Yes |
| Custom service monitoring | No | No | No | Yes |
| Public API | No | No | No | Yes |
| Outbound webhooks | No | No | No | Yes |
| Jira/PagerDuty integration | No | No | No | Yes |
| SMS alerts | No | No | No | Yes |
| Priority support | No | No | No | Yes |

---

## Implementation Priority

### Phase 1 — Free Tier Polish (next up)

These make the free product stickier and drive sign-ups:

1. **F12 — Auto-refresh countdown** (Small) — Instant trust signal
2. **F13 — Status filter buttons** (Small) — Critical during incidents
3. **F21 — SEO & Open Graph** (Small) — Organic traffic
4. **F14 — Uptime sparklines 24h** (Medium) — Visual differentiation
5. **F15 — Grouped category view** (Medium) — Scale to 48+ services

### Phase 2 — Pro Tier Value (conversion drivers)

These justify the $9/mo upgrade:

6. **P5 — Full uptime history** (Large) — The killer feature
7. **P9 — Notification history** (Medium) — Alert accountability
8. **P10 — Incident digest** (Medium) — Passive monitoring
9. **P13 — Real-time SSE** (Large) — Instant updates
10. **P7 — Reliability scorecard** (Large) — Vendor evaluation

### Phase 3 — Team Tier (revenue multiplier)

These enable team pricing:

11. **T1 — Team workspaces** (Large) — Foundation for team tier
12. **T2 — Role-based access** (Large) — Enterprise requirement
13. **T4 — Slack integration** (Large) — #1 requested integration
14. **T6 — SLA tracking** (Large) — High-value for ops teams
15. **T10 — Custom status page** (Large) — Public-facing value

### Phase 4 — Enterprise (high-value contracts)

16. **E1 — SSO/SAML** (Large) — Enterprise gate
17. **E2 — Custom monitoring** (Large) — Platform play
18. **E3 — Public API** (Large) — Developer ecosystem
19. **E4 — Webhooks** (Large) — Automation backbone

---

*StatusHub — Real-time third-party service status aggregator*
*github.com/AnuragBhanderi/StatusHub*
