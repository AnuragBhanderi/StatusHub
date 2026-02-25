import { services as serviceConfigs } from "@/config/services";
import type { ServiceConfig } from "@/config/services";
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
  activeIncidents: {
    id: string;
    title: string;
    status: string;
    impact: string;
    startedAt: string;
    updateCount: number;
    latestUpdateBody?: string;
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
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// ── AWS Health fetcher ──
// Uses service catalog (S3) + current events API

interface AwsService {
  service: string;
  service_name: string;
  region_id: string;
  region_name: string;
}

interface AwsEvent {
  service?: string;
  service_name?: string;
  summary?: string;
  date?: number;
  status?: string;
  region?: string;
  description?: string;
  event_log?: { timestamp: number; status: string; summary: string; message: string }[];
}

interface AwsHealthResult {
  status: string;
  components: { name: string; status: string }[];
  incidents: {
    id: string;
    title: string;
    status: string;
    impact: string;
    startedAt: string;
    description: string;
    isResolved: boolean;
  }[];
}

async function fetchAwsHealth(): Promise<AwsHealthResult | null> {
  try {
    const [servicesRes, eventsRes] = await Promise.all([
      fetch("https://servicedata-us-east-1-prod.s3.amazonaws.com/services.json", {
        headers: { "User-Agent": "StatusHub/1.0" },
        signal: AbortSignal.timeout(15000),
        next: { revalidate: 120 },
      }),
      fetch("https://health.aws.amazon.com/public/currentevents", {
        headers: { "User-Agent": "StatusHub/1.0" },
        signal: AbortSignal.timeout(15000),
        next: { revalidate: 60 },
      }),
    ]);

    if (!servicesRes.ok) return null;

    const allServices: AwsService[] = await servicesRes.json();

    // currentevents returns UTF-16 with BOM — must decode manually
    let events: AwsEvent[] = [];
    if (eventsRes.ok) {
      try {
        const buf = await eventsRes.arrayBuffer();
        // Try UTF-16 first (the API returns charset=utf-16), fallback to UTF-8
        let text: string;
        const bytes = new Uint8Array(buf);
        if (bytes[0] === 0xFE && bytes[1] === 0xFF) {
          text = new TextDecoder("utf-16be").decode(buf);
        } else if (bytes[0] === 0xFF && bytes[1] === 0xFE) {
          text = new TextDecoder("utf-16le").decode(buf);
        } else {
          text = new TextDecoder("utf-8").decode(buf);
        }
        events = JSON.parse(text);
      } catch {
        events = [];
      }
    }

    // Deduplicate services by service_name (they repeat per region)
    const uniqueServices = new Map<string, string>();
    for (const s of allServices) {
      if (!uniqueServices.has(s.service_name)) {
        uniqueServices.set(s.service_name, s.service);
      }
    }

    // Find which service names have active events
    const affectedServices = new Set<string>();
    const incidents: AwsHealthResult["incidents"] = [];

    for (const evt of events) {
      const serviceName = evt.service_name || evt.service || "Unknown";

      const latestLog = evt.event_log?.[0];
      const isResolved = latestLog?.status === "0";

      incidents.push({
        id: `aws-${evt.date || Date.now()}`,
        title: evt.summary || latestLog?.summary || serviceName,
        status: isResolved ? "RESOLVED" : "INVESTIGATING",
        impact: "MAJOR",
        startedAt: evt.date ? new Date(evt.date * 1000).toISOString() : new Date().toISOString(),
        description: evt.description || latestLog?.message || "",
        isResolved,
      });

      if (!isResolved) {
        affectedServices.add(serviceName);
      }
    }

    // Build components list (top services, sorted alphabetically)
    const sortedNames = [...uniqueServices.keys()].sort();
    const components = sortedNames.map((name) => ({
      name,
      status: affectedServices.has(name) ? "PARTIAL_OUTAGE" : "OPERATIONAL",
    }));

    const activeIncidents = incidents.filter((i) => !i.isResolved);
    let status = "OPERATIONAL";
    if (activeIncidents.length > 0) status = "PARTIAL_OUTAGE";

    return { status, components, incidents };
  } catch {
    return null;
  }
}

// ── Google Cloud Status fetcher ──
// Uses products.json (catalog) + incidents.json (events)

interface GcpProduct {
  title: string;
  id: string;
}

interface GcpIncident {
  id: string;
  begin: string;
  end?: string;
  external_desc: string;
  status_impact: string;
  severity: string;
  uri?: string;
  affected_products?: { title: string; id: string }[];
  currently_affected_locations?: { title: string; id: string }[];
  updates?: {
    created: string;
    text: string;
    status: string;
    when?: string;
  }[];
  most_recent_update?: {
    created: string;
    text: string;
    status: string;
    when?: string;
  };
}

interface GcpResult {
  status: string;
  products: GcpProduct[];
  incidents: GcpIncident[];
  activeIncidents: GcpIncident[];
}

async function fetchGcpStatus(): Promise<GcpResult | null> {
  try {
    const [productsRes, incidentsRes] = await Promise.all([
      fetch("https://status.cloud.google.com/products.json", {
        headers: { "User-Agent": "StatusHub/1.0" },
        signal: AbortSignal.timeout(15000),
        next: { revalidate: 120 },
      }),
      fetch("https://status.cloud.google.com/incidents.json", {
        headers: { "User-Agent": "StatusHub/1.0" },
        signal: AbortSignal.timeout(15000),
        next: { revalidate: 60 },
      }),
    ]);

    if (!productsRes.ok || !incidentsRes.ok) return null;

    const productsData = await productsRes.json();
    const products: GcpProduct[] = productsData?.products ?? [];
    const allIncidents: GcpIncident[] = await incidentsRes.json();
    if (!Array.isArray(allIncidents)) return null;

    // Active incidents: no end date and currently_affected_locations is non-empty
    const activeIncidents = allIncidents.filter(
      (inc) => !inc.end && (inc.currently_affected_locations?.length ?? 0) > 0
    );

    // Recent incidents (last 30 days) for detail view
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const recentIncidents = allIncidents.filter((inc) => {
      const ts = Date.parse(inc.begin);
      return !isNaN(ts) && ts > thirtyDaysAgo;
    });

    let status = "OPERATIONAL";
    if (activeIncidents.length > 0) {
      const hasOutage = activeIncidents.some(
        (i) => i.status_impact === "SERVICE_OUTAGE" || i.severity === "high"
      );
      status = hasOutage ? "MAJOR_OUTAGE" : "PARTIAL_OUTAGE";
    }

    return { status, products, incidents: recentIncidents, activeIncidents };
  } catch {
    return null;
  }
}

// ── Azure Status HTML parser ──
// Parses the server-rendered HTML status page for real component data

interface AzureResult {
  status: string;
  components: { name: string; status: string }[];
}

function mapAzureDataLabel(label: string): string {
  const l = label.toLowerCase();
  if (l === "good") return "OPERATIONAL";
  if (l === "warning" || l === "degraded") return "DEGRADED";
  if (l === "critical" || l === "error") return "MAJOR_OUTAGE";
  if (l === "information" || l === "advisory") return "MAINTENANCE";
  // "Not available" means the service doesn't exist in that region — skip
  return "";
}

function mapAzureSvgHref(href: string): string {
  if (href.includes("svg-check")) return "OPERATIONAL";
  if (href.includes("svg-health-warning")) return "DEGRADED";
  if (href.includes("svg-health-error")) return "MAJOR_OUTAGE";
  if (href.includes("svg-health-information")) return "MAINTENANCE";
  return "";
}

async function fetchAzureStatus(): Promise<AzureResult | null> {
  try {
    const res = await fetch("https://azure.status.microsoft/en-us/status", {
      headers: { "User-Agent": "StatusHub/1.0" },
      signal: AbortSignal.timeout(25000),
      next: { revalidate: 120 },
    });
    if (!res.ok) return null;
    const html = await res.text();

    // Parse rows from region-status-table (skip fixed-status-header duplicates)
    // Actual structure:
    //   <tr>
    //     <td>ServiceName</td>
    //     <td class="status-cell"><span ... data-label="Good"><svg><use xlink:href="#svg-check"/></svg></span>...</td>
    //     ...
    //   </tr>
    const components: { name: string; status: string }[] = [];
    const seen = new Set<string>();

    // Match each <tr> that contains status-cell (to skip header rows)
    const rowRegex = /<tr>(\s*<td>[\s\S]*?<\/td>(?:\s*<td\s+class="status-cell">[\s\S]*?<\/td>)+)\s*<\/tr>/gi;
    let rowMatch;
    while ((rowMatch = rowRegex.exec(html)) !== null) {
      const row = rowMatch[1];

      // Service name: first <td> without class
      const nameMatch = row.match(/<td>\s*([\s\S]*?)\s*<\/td>/i);
      if (!nameMatch) continue;
      const name = nameMatch[1].replace(/<[^>]+>/g, "").trim();
      if (!name || seen.has(name)) continue;
      seen.add(name);

      // Status: find worst status across all region columns
      // Use data-label attributes (most reliable)
      let worstStatus = "OPERATIONAL";
      const statusOrder: Record<string, number> = {
        MAJOR_OUTAGE: 0, DEGRADED: 1, MAINTENANCE: 2, OPERATIONAL: 3,
      };

      // Try data-label first
      const labelMatches = [...row.matchAll(/data-label="([^"]+)"/gi)];
      for (const lm of labelMatches) {
        const mapped = mapAzureDataLabel(lm[1]);
        if (mapped && (statusOrder[mapped] ?? 3) < (statusOrder[worstStatus] ?? 3)) {
          worstStatus = mapped;
        }
      }

      // Also check xlink:href for SVG symbols
      const hrefMatches = [...row.matchAll(/xlink:href="#([^"]+)"/gi)];
      for (const hm of hrefMatches) {
        const mapped = mapAzureSvgHref(hm[1]);
        if (mapped && (statusOrder[mapped] ?? 3) < (statusOrder[worstStatus] ?? 3)) {
          worstStatus = mapped;
        }
      }

      components.push({ name, status: worstStatus });
    }

    let overallStatus = "OPERATIONAL";
    if (components.some((c) => c.status === "MAJOR_OUTAGE")) overallStatus = "MAJOR_OUTAGE";
    else if (components.some((c) => c.status === "DEGRADED")) overallStatus = "DEGRADED";
    else if (components.some((c) => c.status === "MAINTENANCE")) overallStatus = "MAINTENANCE";

    return { status: overallStatus, components };
  } catch {
    return null;
  }
}

// ── Builder helpers (shared by fetchAllServicesLive & fetchSingleServiceLive) ──

function buildAwsLiveData(config: ServiceConfig, awsData: AwsHealthResult | null): LiveServiceData {
  const allInc = awsData?.incidents ?? [];
  const activeInc = allInc.filter((i) => !i.isResolved);
  return {
    id: config.slug,
    name: config.name,
    slug: config.slug,
    category: config.category,
    currentStatus: awsData?.status ?? "OPERATIONAL",
    statusPageUrl: config.statusPageUrl,
    logoUrl: config.logoUrl || null,
    lastPolledAt: new Date().toISOString(),
    incidentCount: activeInc.length,
    latestIncident: activeInc[0]
      ? {
          id: activeInc[0].id,
          title: activeInc[0].title,
          status: activeInc[0].status,
          impact: activeInc[0].impact,
          startedAt: activeInc[0].startedAt,
        }
      : null,
    monitoringCount: 0,
    latestMonitoringIncident: null,
    components: awsData?.components,
    activeIncidents: allInc.map((i) => ({
      id: i.id,
      title: i.title,
      status: i.isResolved ? "RESOLVED" : i.status,
      impact: i.impact,
      startedAt: i.startedAt,
      updateCount: 1,
      latestUpdateBody: i.description || undefined,
    })),
  };
}

function buildGcpLiveData(config: ServiceConfig, gcpData: GcpResult | null): LiveServiceData {
  const affectedIds = new Set(
    (gcpData?.activeIncidents ?? []).flatMap((i) => (i.affected_products ?? []).map((p) => p.id))
  );
  const gcpAllIncidents = [
    ...(gcpData?.activeIncidents ?? []),
    ...(gcpData?.incidents ?? []).filter((i) => !!i.end).slice(0, 10),
  ];
  return {
    id: config.slug,
    name: config.name,
    slug: config.slug,
    category: config.category,
    currentStatus: gcpData?.status ?? "OPERATIONAL",
    statusPageUrl: config.statusPageUrl,
    logoUrl: config.logoUrl || null,
    lastPolledAt: new Date().toISOString(),
    incidentCount: gcpData?.activeIncidents.length ?? 0,
    latestIncident: gcpData?.activeIncidents[0]
      ? {
          id: gcpData.activeIncidents[0].id,
          title: gcpData.activeIncidents[0].external_desc,
          status: "INVESTIGATING",
          impact: gcpData.activeIncidents[0].severity === "high" ? "CRITICAL" : "MAJOR",
          startedAt: gcpData.activeIncidents[0].begin,
        }
      : null,
    monitoringCount: 0,
    latestMonitoringIncident: null,
    components: (gcpData?.products ?? []).map((p) => ({
      name: p.title,
      status: affectedIds.has(p.id) ? "PARTIAL_OUTAGE" : "OPERATIONAL",
    })),
    activeIncidents: gcpAllIncidents.map((i) => ({
      id: i.id,
      title: i.external_desc,
      status: i.end ? "RESOLVED" : "INVESTIGATING",
      impact: i.severity === "high" ? "CRITICAL" : "MAJOR",
      startedAt: i.begin,
      updateCount: i.updates?.length ?? (i.most_recent_update ? 1 : 0),
      latestUpdateBody: i.most_recent_update?.text || i.updates?.[0]?.text || undefined,
    })),
  };
}

function buildAzureLiveData(config: ServiceConfig, azureData: AzureResult | null): LiveServiceData {
  return {
    id: config.slug,
    name: config.name,
    slug: config.slug,
    category: config.category,
    currentStatus: azureData?.status ?? "OPERATIONAL",
    statusPageUrl: config.statusPageUrl,
    logoUrl: config.logoUrl || null,
    lastPolledAt: new Date().toISOString(),
    incidentCount: azureData?.components.filter((c) => c.status !== "OPERATIONAL").length ?? 0,
    latestIncident: null,
    monitoringCount: 0,
    latestMonitoringIncident: null,
    components: azureData?.components,
    activeIncidents: [],
  };
}

function buildStatuspageLiveData(config: ServiceConfig, data: StatuspageSummary | null): LiveServiceData {
  if (!data) {
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
      activeIncidents: [],
    };
  }

  let status = mapStatuspageIndicator(data.status?.indicator ?? "none");
  const allIncidents = data.incidents ?? [];
  const unresolvedIncidents = allIncidents.filter((i) => !i.resolved_at);

  const trulyActiveIncidents = unresolvedIncidents.filter(
    (i) => i.status !== "monitoring" && i.impact !== "none"
  );
  const monitoringIncidents = unresolvedIncidents.filter(
    (i) => i.status === "monitoring"
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
    components: (data.components ?? [])
      .filter((c) => !c.group)
      .map((c) => ({
        name: c.name,
        status: mapComponentStatus(c.status),
      })),
    activeIncidents: allIncidents.map((i) => ({
      id: i.id,
      title: i.name,
      status: mapIncidentStatus(i.status),
      impact: mapIncidentImpact(i.impact),
      startedAt: i.started_at,
      updateCount: i.incident_updates?.length ?? 0,
      latestUpdateBody: i.incident_updates?.[0]?.body || undefined,
    })),
  };
}

function buildFallbackLiveData(config: ServiceConfig): LiveServiceData {
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
    activeIncidents: [],
  };
}

// ── Fetch all services (batched) ──

export async function fetchAllServicesLive(): Promise<LiveServiceData[]> {
  const cached = getCached<LiveServiceData[]>("live:all");
  if (cached) return cached;

  const batchSize = 10;
  const results: LiveServiceData[] = [];

  for (let i = 0; i < serviceConfigs.length; i += batchSize) {
    const batch = serviceConfigs.slice(i, i + batchSize);
    const batchResults = await Promise.allSettled(
      batch.map(async (config) => {
        if (config.sourceType === "AWS_HEALTH") {
          return buildAwsLiveData(config, await fetchAwsHealth());
        }
        if (config.sourceType === "GCP_STATUS") {
          return buildGcpLiveData(config, await fetchGcpStatus());
        }
        if (config.sourceType === "AZURE_HTML") {
          return buildAzureLiveData(config, await fetchAzureStatus());
        }
        return buildStatuspageLiveData(config, await fetchStatuspageSummary(config.apiEndpoint));
      })
    );

    for (let j = 0; j < batchResults.length; j++) {
      const result = batchResults[j];
      if (result.status === "fulfilled") {
        results.push(result.value);
      } else {
        results.push(buildFallbackLiveData(batch[j]));
      }
    }
  }

  setMemCache("live:all", results);
  return results;
}

// ── Fetch single service (for webhooks) ──

export async function fetchSingleServiceLive(
  slug: string,
  options?: { bypassCache?: boolean }
): Promise<LiveServiceData | null> {
  const config = serviceConfigs.find((s) => s.slug === slug);
  if (!config) return null;

  if (!options?.bypassCache) {
    const allCached = getCached<LiveServiceData[]>("live:all");
    if (allCached) {
      const found = allCached.find((s) => s.slug === slug);
      if (found) return found;
    }
  }

  if (config.sourceType === "AWS_HEALTH") {
    return buildAwsLiveData(config, await fetchAwsHealth());
  }
  if (config.sourceType === "GCP_STATUS") {
    return buildGcpLiveData(config, await fetchGcpStatus());
  }
  if (config.sourceType === "AZURE_HTML") {
    return buildAzureLiveData(config, await fetchAzureStatus());
  }
  return buildStatuspageLiveData(config, await fetchStatuspageSummary(config.apiEndpoint));
}

// ── Find service config by status page URL (for webhook identification) ──

export function findServiceConfigByStatusPageUrl(url: string): ServiceConfig | undefined {
  const normalized = url.replace(/\/+$/, "").toLowerCase();
  return serviceConfigs.find(
    (s) => s.statusPageUrl.replace(/\/+$/, "").toLowerCase() === normalized
  );
}

export async function fetchServiceDetailLive(slug: string): Promise<LiveServiceDetail | null> {
  const cacheKey = `live:detail:${slug}`;
  const cached = getCached<LiveServiceDetail>(cacheKey);
  if (cached) return cached;

  const config = serviceConfigs.find((s) => s.slug === slug);
  if (!config) return null;

  if (config.sourceType === "AWS_HEALTH") {
    const awsData = await fetchAwsHealth();
    const detail: LiveServiceDetail = {
      service: {
        id: config.slug,
        name: config.name,
        slug: config.slug,
        category: config.category,
        currentStatus: awsData?.status ?? "OPERATIONAL",
        statusPageUrl: config.statusPageUrl,
        logoUrl: config.logoUrl || null,
        lastPolledAt: new Date().toISOString(),
      },
      components: awsData?.components ?? [],
      incidents: (awsData?.incidents ?? []).map((inc) => ({
        id: inc.id,
        title: inc.title,
        status: inc.status,
        impact: inc.impact,
        startedAt: inc.startedAt,
        resolvedAt: inc.isResolved ? inc.startedAt : null,
        sourceUrl: null,
        updates: [{
          id: `${inc.id}-update`,
          status: inc.status,
          body: inc.description || inc.title,
          createdAt: inc.startedAt,
        }],
      })),
    };
    setMemCache(cacheKey, detail);
    return detail;
  }

  if (config.sourceType === "GCP_STATUS") {
    const gcpData = await fetchGcpStatus();
    const affectedIds = new Set(
      (gcpData?.activeIncidents ?? []).flatMap((i) => (i.affected_products ?? []).map((p) => p.id))
    );
    const detail: LiveServiceDetail = {
      service: {
        id: config.slug,
        name: config.name,
        slug: config.slug,
        category: config.category,
        currentStatus: gcpData?.status ?? "OPERATIONAL",
        statusPageUrl: config.statusPageUrl,
        logoUrl: config.logoUrl || null,
        lastPolledAt: new Date().toISOString(),
      },
      components: (gcpData?.products ?? []).map((p) => ({
        name: p.title,
        status: affectedIds.has(p.id) ? "PARTIAL_OUTAGE" : "OPERATIONAL",
      })),
      incidents: (gcpData?.incidents ?? []).map((inc) => ({
        id: inc.id,
        title: inc.external_desc,
        status: inc.end ? "RESOLVED" : "INVESTIGATING",
        impact: inc.severity === "high" ? "CRITICAL" : "MAJOR",
        startedAt: inc.begin,
        resolvedAt: inc.end ?? null,
        sourceUrl: inc.uri ? `https://status.cloud.google.com/${inc.uri}` : null,
        updates: (inc.updates ?? []).map((u, idx) => ({
          id: `${inc.id}-${idx}`,
          status: u.status === "AVAILABLE" ? "RESOLVED" : "INVESTIGATING",
          body: u.text,
          createdAt: u.when ?? u.created,
        })),
      })),
    };
    setMemCache(cacheKey, detail);
    return detail;
  }

  if (config.sourceType === "AZURE_HTML") {
    const azureData = await fetchAzureStatus();
    const detail: LiveServiceDetail = {
      service: {
        id: config.slug,
        name: config.name,
        slug: config.slug,
        category: config.category,
        currentStatus: azureData?.status ?? "OPERATIONAL",
        statusPageUrl: config.statusPageUrl,
        logoUrl: config.logoUrl || null,
        lastPolledAt: new Date().toISOString(),
      },
      components: azureData?.components ?? [],
      incidents: [],
    };
    setMemCache(cacheKey, detail);
    return detail;
  }

  const data = await fetchStatuspageSummary(config.apiEndpoint);
  if (!data) return null;

  let status = mapStatuspageIndicator(data.status?.indicator ?? "none");
  const allIncidents = data.incidents ?? [];
  const unresolvedIncidents = allIncidents.filter((i) => !i.resolved_at);

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
    components: (data.components ?? [])
      .filter((c) => !c.group)
      .map((c) => ({
        name: c.name,
        status: mapComponentStatus(c.status),
      })),
    incidents: allIncidents.map((inc) => ({
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
