# StatusHub — Free Marketing Playbook

Zero-budget strategies to grow StatusHub from side project to widely-adopted developer tool.

---

## 1. GitHub as Your Storefront

- **Visual demo** — Add a GIF or video recording at the top of README (screen record with QuickTime)
- **Repository topics/tags**: `status-page`, `devops`, `incident-management`, `aws-status`, `nextjs`, `monitoring`, `open-source`, `developer-tools`
- **Submit to GitHub Collections**: "Made with Supabase", "DevOps Tools", "Developer Tools"
- **Add `CONTRIBUTING.md`** — invites open-source contributors who become evangelists
- **Enable GitHub Discussions** — seed with a "Show your stack" thread to build community
- **GitHub Sponsors** — enable to signal project legitimacy (even if no one sponsors yet)

---

## 2. Reddit (Highest ROI for Developer Tools)

Post as a genuine "I built this" share, never as an ad. Lead with the problem, not the product.

**Opening hook**: "Anyone else tired of checking 6 different status pages during an outage?"

| Subreddit | Angle |
|-----------|-------|
| r/selfhosted | "I built an open-source status aggregator for 48+ services" |
| r/devops | "We monitor our infra but not our vendors — built a tool for that" |
| r/webdev | "Side project: real-time dashboard for AWS/GCP/Azure + 45 other services" |
| r/nextjs | "Built with Next.js 16 + React 19 — here's the architecture" |
| r/sideproject | Standard project showcase with screenshots |
| r/SaaS | "From open-source to SaaS — my roadmap and lessons" |
| r/programming | Technical deep-dive on parsing 3 different status page formats |

**Rules**:
- Lead with the problem, not the product
- Include screenshots — the dashboard looks good
- Reply to every comment — engagement boosts visibility
- Don't crosspost the same day — space posts 3-5 days apart

---

## 3. Hacker News

- **Format**: "Show HN: StatusHub — Open-source dashboard that aggregates 48 service status pages"
- **Best time**: Tuesday–Thursday, 8–10 AM ET
- **Top-level comment**: Explain motivation, tech stack, what you learned
- **HN loves**: open-source, solo dev stories, genuine technical depth, unique architecture decisions

The UTF-16 BOM parsing story and Azure HTML scraping are exactly the kind of technical detail HN appreciates.

---

## 4. Dev Community Content (Free Distribution)

Write articles on free platforms. Each article naturally links back to StatusHub.

| Platform | Article Idea |
|----------|-------------|
| **Dev.to** | "How I parse AWS, GCP, and Azure status pages in real-time" (UTF-16 BOM story) |
| **Dev.to** | "Building a SaaS from an open-source project — my roadmap" |
| **Dev.to** | "I aggregated 48 status pages into one dashboard — here's what I learned" |
| **Hashnode** | "Why every DevOps team needs a vendor status aggregator" |
| **Medium** | "The 3 status page architectures: Statuspage API vs RSS vs HTML scraping" |
| **Hashnode** | "From localStorage to Supabase: adding auth to a Next.js side project" |

**Content formula**: Problem you faced → How you solved it → What you built → Link to repo/live site

---

## 5. Social Media (Build in Public)

### Twitter/X + Bluesky

- Post progress updates: "Added real-time Azure status parsing (168 services) to StatusHub today"
- Share dashboard screenshots — visual content gets engagement
- Tag relevant accounts (@vercel, @supabase, @awscloud) when genuinely relevant
- Hashtags: #buildinpublic #opensource #devtools #devops
- Thread format works well: "I built an open-source alternative to IsDown. Here's why (thread):"

### LinkedIn

- DevOps managers and engineering leads browse LinkedIn daily
- Position as "a tool your engineering team needs"
- Write posts framed as industry insights, not product plugs:
  - "Most teams monitor their own infra but completely ignore vendor status. Here's what that costs..."
  - "During last week's AWS outage, teams spent 20 minutes figuring out what was down. It should take 2 seconds."

---

## 6. Product Directories (Free Listings)

Submit to all of these — they drive steady organic traffic over time.

| Directory | Notes |
|-----------|-------|
| **Product Hunt** | Launch at 12:01 AM PT, get 5+ upvotes from friends in first hour |
| **AlternativeTo** | List as alternative to IsDown, Downdetector, Instatus |
| **OpenSourceAlternative.to** | Open-source focused directory |
| **SaaSHub.com** | SaaS product directory |
| **Uneed.best** | Indie product directory |
| **MicroLaunch** | For indie makers and small products |
| **BetaList** | Early-stage product listings |
| **Indie Hackers** | Post in products section + write about the journey |
| **ToolsForDevs.com** | Developer tools directory |
| **DevHunt** | Developer tool launches (like Product Hunt for devs) |

---

## 7. Developer Communities (Participate, Then Share)

Join and genuinely participate first. Share StatusHub when it's naturally relevant.

| Community | Platform |
|-----------|----------|
| Supabase Discord | Active community, they spotlight projects |
| Vercel Discord | Next.js builders community |
| Next.js Discord | Framework-specific discussions |
| DevOps Chat Slack | DevOps professionals |
| SRE Community Slack | Site reliability engineers |
| Rands Leadership Slack | Engineering leaders |
| Dev.to comment sections | When someone posts about monitoring/outages |

**Rule**: Give value first (answer questions, help others), then share your project when relevant. Never spam.

---

## 8. SEO (Free, Compounds Over Time)

### Target Keywords

StatusHub's landing page and future blog should target these high-intent searches:

- "is AWS down right now"
- "cloud service status dashboard"
- "check multiple status pages at once"
- "AWS GCP Azure status aggregator"
- "open source status page aggregator"
- "is [service name] down" (for each of 48 services)

### Blog Strategy

Add a `/blog` route with posts like:
- "How to check if AWS is down" (one post per major service)
- "Top 5 tools to monitor third-party service status"
- "What to do when your cloud provider goes down"
- "How to set up vendor status alerts for your team"

Each post is a free SEO landing page that compounds traffic over months.

---

## 9. Outage Moment Marketing (Your Unfair Advantage)

This is StatusHub's superpower. When a major outage happens, everyone searches for status info.

### Setup
- Set up Google Alerts for: "AWS outage", "GitHub down", "Vercel outage", "Azure outage", "GCP outage", "Cloudflare down"
- Prepare template tweets/posts with placeholder for the affected service
- Have StatusHub open and ready to screenshot

### During an Outage
1. Screenshot StatusHub showing the outage in real-time (the dashboard view with red/yellow indicators)
2. Tweet: "AWS US-East-1 is experiencing issues — here's a real-time view of all affected services [screenshot] [link]"
3. Post on r/devops or r/sysadmin: "[Service] outage — real-time status across all 48 services"
4. These posts go viral during outages when everyone is searching for answers

### Why This Works
- Massive search volume during outages (millions of people searching "is X down")
- Your tool provides genuine value in that moment
- One viral outage post can drive thousands of signups
- It's not opportunistic — you're providing a real service when people need it most

---

## 10. Strategic Partnerships (Free)

### Platform Showcases

- **Supabase Showcase** — they actively spotlight projects built with Supabase (submit at supabase.com/showcase)
- **Vercel Templates/Showcase** — gallery of production Next.js apps
- **Next.js Showcase** — official directory of sites built with Next.js

### Open Source Partnerships

- **Awesome lists** — submit to `awesome-selfhosted`, `awesome-devops`, `awesome-nextjs`, `awesome-react`
- **Supabase community** — write a guest post for their blog about building with Supabase
- **Vercel blog** — pitch a case study about real-time data fetching at scale

---

## Priority Execution Order

### Week 1
1. Submit to Product Hunt, AlternativeTo, SaaSHub, OpenSourceAlternative.to, DevHunt
2. Add GIF demo to README, update GitHub topics
3. Write first Dev.to article (the AWS UTF-16 parsing technical story)

### Week 2
4. Post on r/selfhosted and r/devops (space 3 days apart)
5. Submit Show HN post (Tuesday–Thursday, 8–10 AM ET)
6. Submit to Supabase Showcase and Vercel Showcase

### Week 3
7. Start build-in-public posting on Twitter/LinkedIn (2-3 posts per week)
8. Join 2-3 developer Discord/Slack communities, start participating
9. Write second Dev.to article (open-source to SaaS journey)

### Ongoing
10. Set up Google Alerts for outage moment marketing
11. Write one SEO blog post per week targeting "is [service] down" keywords
12. Post on Indie Hackers monthly with revenue/growth updates
13. Engage with every Reddit/HN comment on your posts

---

## Metrics to Track (Free Tools)

| Metric | Tool |
|--------|------|
| GitHub stars & traffic | GitHub Insights (built-in) |
| Website visitors | Vercel Analytics (free tier) |
| Referral sources | Vercel Analytics |
| Reddit post performance | Reddit's built-in analytics |
| Search rankings | Google Search Console (free) |
| Social engagement | Native platform analytics |

---

## Key Principles

1. **Lead with the problem, not the product.** "Tired of checking 6 status pages?" beats "Check out my app!"
2. **Be genuinely helpful.** Answer questions in communities before promoting anything.
3. **Outage moments are gold.** Be ready to post when major services go down.
4. **Consistency beats virality.** One post per week for 6 months beats one viral post.
5. **Open-source is your moat.** It builds trust, drives contributions, and creates evangelists.
6. **Every technical article is marketing.** Developers share interesting technical content — your architecture IS your marketing.

---

*StatusHub — Real-time third-party service status aggregator*
*github.com/AnuragBhanderi/StatusHub*
