# StatusHub — SaaS Roadmap

Phased plan to take StatusHub from an open-source dashboard to a revenue-generating SaaS product.

---

## Phase 0 — Current State (Updated Feb 2026)

**Stack:** Next.js 16 + React 19 + Supabase (auth + DB) + Nodemailer + Vercel.

**What works:**
- Core dashboard — 48 services across 14 categories, real-time status, incident intelligence, 3 themes, My Stack with sharing
- Cloud provider deep integration — AWS (270 services), Google Cloud (201 products), Azure (168 services) with real component-level data
- User auth via Supabase OAuth (GitHub/Google) with cloud sync for preferences
- Email notifications — granular alerts for 5 event types with per-service rate limiting
- Browser push notifications for My Stack services
- Landing page with live status preview, feature showcase, pricing section
- Responsive design, keyboard shortcuts, WCAG accessibility

**What's been completed from Phases 1-2:** Auth, cloud sync, landing page, email alerts, browser notifications, alert preferences. See details below.

---

## Phase 1 — Foundation (The Minimum to Charge Money)

**Goal:** A hosted version where users can sign up, log in, and get value they can't get from the open-source version.

**Timeline:** 4–6 weeks

### Infrastructure to Add

| Component | Recommended Choice | Why |
|---|---|---|
| Auth | NextAuth.js (Auth.js) with GitHub + Google | Already in Next.js ecosystem, free, supports OAuth |
| Database | Supabase (Postgres) or PlanetScale | Free tier to start, scales later |
| Hosting | Vercel | Already have a deploy button, free tier is generous |
| Payments | Stripe | Industry standard |

### Features to Build

1. **User accounts** — sign up, log in, persist My Stack to the database instead of localStorage — **DONE** (Supabase OAuth)
2. **Cloud sync** — starred services, theme, sort preference follow you across devices — **DONE**
3. **Custom stack builder** — pick from 48+ services, save as your personal dashboard — **DONE** (My Stack + sharing URLs)
4. **Landing page** — marketing site explaining the value prop, pricing, sign-up CTA — **DONE**

### Pricing

| Tier | Price | What |
|---|---|---|
| Free | $0 | Up to 10 services in your stack, basic dashboard |
| Pro | $9/mo | Unlimited services, cloud sync, priority data refresh |

### What This Unlocks

- Users with accounts (can email them, track usage, iterate)
- Payment infrastructure (Stripe integration)
- Open-source version stays free and acts as top-of-funnel

---

## Phase 2 — The Feature People Pay For (Alerts)

**Goal:** Become the tool teams can't turn off because it actively notifies them.

**Timeline:** 4–6 weeks

### Features to Build

1. **Email alerts** — notification when a stack service goes down — **DONE** (Nodemailer + custom HTML templates + 5 event types + rate limiting)
2. **Slack/Discord webhooks** — push outage alerts to a team channel — Planned
3. **Browser push notifications** — instant popup, no backend polling needed from user's side — **DONE**
4. **Alert preferences** — per-service severity thresholds (only alert on major outages, not minor degradation) — **DONE** (granular toggle per event type)
5. **Incident digest** — daily/weekly email summary of stack incidents — Planned

### Infrastructure to Add

| Component | Why |
|---|---|
| Background worker (Vercel cron) | Poll services and detect status changes to trigger alerts |
| Email service (Resend or SendGrid) | Transactional emails for alerts and digests |
| Queue (Upstash Redis) | Rate-limit outbound notifications, prevent duplicates |

### Updated Pricing

| Tier | Price | What |
|---|---|---|
| Free | $0 | 10 services, dashboard only, no alerts |
| Pro | $19/mo | Unlimited services, email + browser alerts, Slack integration, incident digest |

### Why This Phase Matters

Alerts are the #1 upgrade trigger. Once someone relies on StatusHub to tell them when something breaks (instead of checking manually), they won't cancel. This is where retention lives.

---

## Phase 3 — Teams & Analytics (Revenue Multiplier)

**Goal:** Move from individual users to team seats — this is where SaaS revenue scales.

**Timeline:** 8–12 weeks

### Features to Build

1. **Team workspaces** — invite teammates, shared stack, shared alert channels
2. **Role-based access** — admin configures the stack, members view + get alerts
3. **Uptime history & analytics** — 7d/30d/90d uptime percentages per service, stored server-side
4. **Reliability scorecard** — per-service uptime %, incident count, avg resolution time
5. **SLA tracking** — set targets per service, get breach alerts
6. **Incident correlation** — auto-detect when internal incidents align with upstream outages
7. **Maintenance calendar** — aggregated view of upcoming vendor maintenance windows

### Updated Pricing

| Tier | Price | What |
|---|---|---|
| Free | $0 | 1 user, 10 services, dashboard only |
| Pro | $19/mo per user | Unlimited services, alerts, history, analytics |
| Team | $49/mo (5 seats included, +$12/seat) | Shared workspace, SLA tracking, maintenance calendar, incident correlation |
| Enterprise | Custom | SSO/SAML, custom monitoring, API access, dedicated support |

---

## Phase 4 — Platform & Moat (Defensibility)

**Goal:** Make StatusHub hard to leave and hard to compete with.

**Timeline:** Ongoing

### Features to Build

1. **Custom service monitoring** — users add their own internal URLs alongside third-party services
2. **Public API** — `/api/v1/services`, `/api/v1/incidents` with API keys and rate limits
3. **Webhooks** — trigger automated runbooks when a dependency goes down
4. **Dependency mapping** — "Vercel depends on AWS" → when AWS is down, flag all dependents
5. **AI incident summaries** — LLM-powered plain-English summaries of verbose vendor updates
6. **Public status page generator** — branded `/status/[company]` page reflecting upstream dependencies
7. **Integrations marketplace** — PagerDuty, OpsGenie, Jira auto-ticket creation

### Revenue Target

$10K–50K+ MRR through team plans and enterprise contracts.

---

## Timeline Summary

```
Phase 1 — Foundation          COMPLETE      (auth, db, landing page)
Phase 2 — Alerts              80% DONE      (email ✓, push ✓, preferences ✓ | Slack/Discord + digest remaining)
Phase 3 — Teams & Analytics   Next          (workspaces, history, SLA, correlation)
Phase 4 — Platform            Planned       (API, custom monitoring, AI, integrations)
```

---

## Key Decisions

1. **Open-source strategy:** Keep the core dashboard open-source (drives adoption), gate alerts + teams + history behind the SaaS.
2. **Go-to-market:** Start self-serve (credit card on the site), add sales for enterprise later in Phase 3–4.
3. **Infrastructure:** Vercel is fine through Phase 2. By Phase 3, evaluate Railway or a VPS for background workers and heavy DB usage.
4. **Team:** Phase 1–2 is doable solo. Phase 3+ with team/enterprise features benefits from a co-founder or contractor for backend infra.

---

## Competitive Positioning

StatusHub lets you **consume** everyone else's status. Competitors like Statuspage.io let you **publish** yours. It's the difference between a weather station and a weather dashboard — most teams need the dashboard.

### Direct Competitors

| Competitor | How StatusHub Differs |
|---|---|
| IsDown | Paid-only, no open-source version, less developer-focused UX |
| Downdetector | Crowdsourced (noisy), consumer-focused, not API-driven |
| Instatus | Status page publisher first, aggregation is secondary |
| ThousandEyes (Cisco) | Enterprise-grade, expensive, overkill for most teams |

### Adjacent Tools (Complement, Don't Replace)

- Statuspage.io (Atlassian) — publishes your status
- PagerDuty / OpsGenie — incident management, doesn't aggregate vendor status
- Datadog / New Relic — monitors your infra, not your vendors
- Rootly / incident.io — incident response platforms

---

*StatusHub — Real-time third-party service status aggregator*
*github.com/AnuragBhanderi/StatusHub*