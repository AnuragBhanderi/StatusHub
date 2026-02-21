import { services as serviceConfigs } from "@/config/services";
import { mapStatuspageIndicator, mapIncidentImpact, mapIncidentStatus } from "@/lib/normalizer";

export interface LiveServiceData {
  id: string;
  name: string;
  slug: string;
  category: string;
  currentStatus: string;
  statusPageUrl: string;
  logoUrl: string | null;
  lastPolledAt: string | null;
  incidentCount: number;
  latestIncident: {
    id: string;
    title: string;
    status: string;
    impact: string;
    startedAt: string;
  } | null;
  monitoringCount: number;
  latestMonitoringIncident: {
    id: string;
    title: string;
    status: string;
    impact: string;
    startedAt: string;
  } | null;
  components?: {
    name: string;
    status: string;
  }[];
}

export interface LiveServiceDetail {
  service: {
    id: string;
    name: string;
    slug: string;
    category: string;
    currentStatus: string;
    statusPageUrl: string;
    logoUrl: string | null;
    lastPolledAt: string | null;
  };
  components: {
    name: string;
    status: string;
  }[];
  incidents: {
    id: string;
    title: string;
    status: string;
    impact: string;
    startedAt: string;
    resolvedAt: string | null;
    sourceUrl: string | null;
    updates: {
      id: string;
      status: string;
      body: string;
      createdAt: string;
    }[];
  }[];
}

// In-memory cache with TTL
const cache = new Map<string, { data: unknown; expiresAt: number }>();
const CACHE_TTL = 120_000; // 2 minutes

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setMemCache<T>(key: string, data: T): void {
  cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL });
}

interface StatuspageComponent {
  id: string;
  name: string;
  status: string;
  description: string | null;
  group: boolean;
}

interface StatuspageIncidentUpdate {
  id: string;
  status: string;
  body: string;
  created_at: string;
  updated_at: string;
}

interface StatuspageIncident {
  id: string;
  name: string;
  status: string;
  impact: string;
  started_at: string;
  resolved_at: string | null;
  shortlink: string;
  incident_updates: StatuspageIncidentUpdate[];
}

interface StatuspageSummary {
  status: { indicator: string; description: string };
  components: StatuspageComponent[];
  incidents: StatuspageIncident[];
}

function mapComponentStatus(status: string): string {
  switch (status) {
    case "operational": return "OPERATIONAL";
    case "degraded_performance": return "DEGRADED";
    case "partial_outage": return "PARTIAL_OUTAGE";
    case "major_outage": return "MAJOR_OUTAGE";
    case "under_maintenance": return "MAINTENANCE";
    default: return "UNKNOWN";
  }
}

async function fetchStatuspageSummary(apiEndpoint: string): Promise<StatuspageSummary | null> {
  try {
    const res = await fetch(apiEndpoint, {
      headers: { "User-Agent": "StatusHub/1.0" },
      signal: AbortSignal.timeout(15000),
      next: { revalidate: 120 },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function fetchAllServicesLive(): Promise<LiveServiceData[]> {
  const cached = getCached<LiveServiceData[]>("live:all");
  if (cached) return cached;

  // Fetch all statuspage services in parallel (batched to avoid overwhelming)
  const batchSize = 10;
  const results: LiveServiceData[] = [];

  for (let i = 0; i < serviceConfigs.length; i += batchSize) {
    const batch = serviceConfigs.slice(i, i + batchSize);
    const batchResults = await Promise.allSettled(
      batch.map(async (config) => {
        if (config.sourceType !== "STATUSPAGE_API") {
          // For non-statuspage services, return with UNKNOWN status
          // (AWS, GCP, Azure need special parsers)
          return {
            id: config.slug,
            name: config.name,
            slug: config.slug,
            category: config.category,
            currentStatus: "OPERATIONAL",
            statusPageUrl: config.statusPageUrl,
            logoUrl: config.logoUrl || null,
            lastPolledAt: null,
            incidentCount: 0,
            latestIncident: null,
            monitoringCount: 0,
            latestMonitoringIncident: null,
          } satisfies LiveServiceData;
        }

        const data = await fetchStatuspageSummary(config.apiEndpoint);
        if (!data) {
          // API unreachable — assume operational rather than showing UNKNOWN
          return {
            id: config.slug,
            name: config.name,
            slug: config.slug,
            category: config.category,
            currentStatus: "OPERATIONAL",
            statusPageUrl: config.statusPageUrl,
            logoUrl: config.logoUrl || null,
            lastPolledAt: null,
            incidentCount: 0,
            latestIncident: null,
            monitoringCount: 0,
            latestMonitoringIncident: null,
          } satisfies LiveServiceData;
        }

        let status = mapStatuspageIndicator(data.status.indicator);
        const unresolvedIncidents = data.incidents.filter((i) => !i.resolved_at);

        // Split unresolved incidents: monitoring/none-impact are not truly active
        const trulyActiveIncidents = unresolvedIncidents.filter(
          (i) => i.status !== "monitoring" && i.impact !== "none"
        );
        const monitoringIncidents = unresolvedIncidents.filter(
          (i) => i.status === "monitoring"
        );

        // Only override status for truly active incidents (not monitoring/none)
        if (status === "OPERATIONAL" && trulyActiveIncidents.length > 0) {
          const worstImpact = trulyActiveIncidents.reduce((worst, inc) => {
            const order: Record<string, number> = { critical: 3, major: 2, minor: 1, none: 0 };
            return (order[inc.impact] ?? 0) > (order[worst] ?? 0) ? inc.impact : worst;
          }, "none");
          if (worstImpact === "critical") status = "MAJOR_OUTAGE";
          else if (worstImpact === "major") status = "PARTIAL_OUTAGE";
          else if (worstImpact === "minor") status = "DEGRADED";
        }

        return {
          id: config.slug,
          name: config.name,
          slug: config.slug,
          category: config.category,
          currentStatus: status,
          statusPageUrl: config.statusPageUrl,
          logoUrl: config.logoUrl || null,
          lastPolledAt: new Date().toISOString(),
          incidentCount: trulyActiveIncidents.length,
          latestIncident: trulyActiveIncidents[0]
            ? {
                id: trulyActiveIncidents[0].id,
                title: trulyActiveIncidents[0].name,
                status: mapIncidentStatus(trulyActiveIncidents[0].status),
                impact: mapIncidentImpact(trulyActiveIncidents[0].impact),
                startedAt: trulyActiveIncidents[0].started_at,
              }
            : null,
          monitoringCount: monitoringIncidents.length,
          latestMonitoringIncident: monitoringIncidents[0]
            ? {
                id: monitoringIncidents[0].id,
                title: monitoringIncidents[0].name,
                status: mapIncidentStatus(monitoringIncidents[0].status),
                impact: mapIncidentImpact(monitoringIncidents[0].impact),
                startedAt: monitoringIncidents[0].started_at,
              }
            : null,
          components: data.components
            .filter((c) => !c.group)
            .map((c) => ({
              name: c.name,
              status: mapComponentStatus(c.status),
            })),
        } satisfies LiveServiceData;
      })
    );

    for (const result of batchResults) {
      if (result.status === "fulfilled") {
        results.push(result.value);
      }
    }
  }

  setMemCache("live:all", results);
  return results;
}

export async function fetchServiceDetailLive(slug: string): Promise<LiveServiceDetail | null> {
  const cacheKey = `live:detail:${slug}`;
  const cached = getCached<LiveServiceDetail>(cacheKey);
  if (cached) return cached;

  const config = serviceConfigs.find((s) => s.slug === slug);
  if (!config) return null;

  if (config.sourceType !== "STATUSPAGE_API") {
    // For non-statuspage services, return basic info
    const detail: LiveServiceDetail = {
      service: {
        id: config.slug,
        name: config.name,
        slug: config.slug,
        category: config.category,
        currentStatus: "OPERATIONAL",
        statusPageUrl: config.statusPageUrl,
        logoUrl: config.logoUrl || null,
        lastPolledAt: null,
      },
      components: [],
      incidents: [],
    };
    return detail;
  }

  const data = await fetchStatuspageSummary(config.apiEndpoint);
  if (!data) return null;

  let status = mapStatuspageIndicator(data.status.indicator);
  const unresolvedIncidents = data.incidents.filter((i) => !i.resolved_at);

  // Only override status for truly active incidents (not monitoring/none-impact)
  const trulyActiveIncidents = unresolvedIncidents.filter(
    (i) => i.status !== "monitoring" && i.impact !== "none"
  );
  if (status === "OPERATIONAL" && trulyActiveIncidents.length > 0) {
    const worstImpact = trulyActiveIncidents.reduce((worst, inc) => {
      const order: Record<string, number> = { critical: 3, major: 2, minor: 1, none: 0 };
      return (order[inc.impact] ?? 0) > (order[worst] ?? 0) ? inc.impact : worst;
    }, "none");
    if (worstImpact === "critical") status = "MAJOR_OUTAGE";
    else if (worstImpact === "major") status = "PARTIAL_OUTAGE";
    else if (worstImpact === "minor") status = "DEGRADED";
  }

  const detail: LiveServiceDetail = {
    service: {
      id: config.slug,
      name: config.name,
      slug: config.slug,
      category: config.category,
      currentStatus: status,
      statusPageUrl: config.statusPageUrl,
      logoUrl: config.logoUrl || null,
      lastPolledAt: new Date().toISOString(),
    },
    components: data.components
      .filter((c) => !c.group)
      .map((c) => ({
        name: c.name,
        status: mapComponentStatus(c.status),
      })),
    incidents: data.incidents.map((inc) => ({
      id: inc.id,
      title: inc.name,
      status: mapIncidentStatus(inc.status),
      impact: mapIncidentImpact(inc.impact),
      startedAt: inc.started_at,
      resolvedAt: inc.resolved_at,
      sourceUrl: inc.shortlink || null,
      updates: inc.incident_updates.map((u) => ({
        id: u.id,
        status: mapIncidentStatus(u.status),
        body: u.body,
        createdAt: u.created_at,
      })),
    })),
  };

  setMemCache(cacheKey, detail);
  return detail;
}
