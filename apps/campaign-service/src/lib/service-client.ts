/**
 * Service client for cross-service calls from campaign-service
 */

const APOLLO_SERVICE_URL = process.env.APOLLO_SERVICE_URL || "http://localhost:3003";
const EMAILGENERATION_SERVICE_URL = process.env.EMAILGENERATION_SERVICE_URL || "http://localhost:3004";
const POSTMARK_SERVICE_URL = process.env.POSTMARK_SERVICE_URL || "http://localhost:3006";

// Service API keys for inter-service auth
const APOLLO_SERVICE_API_KEY = process.env.APOLLO_SERVICE_API_KEY;
const EMAILGENERATION_SERVICE_API_KEY = process.env.EMAILGENERATION_SERVICE_API_KEY;
const POSTMARK_SERVICE_API_KEY = process.env.POSTMARK_SERVICE_API_KEY;

interface ApolloStats {
  leadsFound: number;
  searchesCount: number;
  totalPeopleFromSearches: number;
}

interface EmailGenStats {
  emailsGenerated: number;
}

interface PostmarkStats {
  emailsSent: number;
  emailsOpened: number;
  emailsClicked: number;
  emailsReplied: number;
  emailsBounced: number;
  repliesWillingToMeet: number;
  repliesInterested: number;
  repliesNotInterested: number;
  repliesOutOfOffice: number;
  repliesUnsubscribe: number;
}

export interface AggregatedStats {
  leadsFound: number;
  emailsGenerated: number;
  emailsSent: number;
  emailsOpened: number;
  emailsClicked: number;
  emailsReplied: number;
  emailsBounced: number;
  repliesWillingToMeet: number;
  repliesInterested: number;
  repliesNotInterested: number;
  repliesOutOfOffice: number;
  repliesUnsubscribe: number;
}

async function fetchStats<T>(url: string, clerkOrgId: string, body: unknown, apiKey?: string): Promise<T | null> {
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "X-Clerk-Org-Id": clerkOrgId,
    };
    
    if (apiKey) {
      headers["X-API-Key"] = apiKey;
    }
    
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      console.warn(`Stats fetch failed: ${url} - ${response.status}`);
      return null;
    }

    const data = await response.json();
    return data.stats as T;
  } catch (error) {
    console.warn(`Stats fetch error: ${url}`, error);
    return null;
  }
}

export interface LeadData {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  title: string | null;
  organizationName: string | null;
  organizationDomain: string | null;
  organizationIndustry: string | null;
  organizationSize: string | null;
  linkedinUrl: string | null;
  enrichmentRunId: string | null;
  createdAt: string;
}

async function fetchData<T>(url: string, clerkOrgId: string, apiKey?: string): Promise<T | null> {
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "X-Clerk-Org-Id": clerkOrgId,
    };
    
    if (apiKey) {
      headers["X-API-Key"] = apiKey;
    }
    
    const response = await fetch(url, { headers });

    if (!response.ok) {
      console.warn(`Data fetch failed: ${url} - ${response.status}`);
      return null;
    }

    return await response.json() as T;
  } catch (error) {
    console.warn(`Data fetch error: ${url}`, error);
    return null;
  }
}

export async function getLeadsForRuns(
  runIds: string[],
  clerkOrgId: string
): Promise<LeadData[]> {
  if (runIds.length === 0) return [];

  const allLeads: LeadData[] = [];

  // Fetch leads for each run from apollo-service
  for (const runId of runIds) {
    const result = await fetchData<{ enrichments: LeadData[] }>(
      `${APOLLO_SERVICE_URL}/enrichments/${runId}`,
      clerkOrgId,
      APOLLO_SERVICE_API_KEY
    );
    if (result?.enrichments) {
      allLeads.push(...result.enrichments);
    }
  }

  return allLeads;
}

export interface CompanyData {
  id: string;
  name: string;
  domain: string | null;
  industry: string | null;
  employeeCount: string | null;
  leadsCount: number;
  enrichmentRunIds: string[];
}

export function aggregateCompaniesFromLeads(leads: LeadData[]): CompanyData[] {
  // Group leads by organization name
  const companyMap = new Map<string, {
    name: string;
    domain: string | null;
    industry: string | null;
    employeeCount: string | null;
    leadsCount: number;
    enrichmentRunIds: string[];
  }>();

  for (const lead of leads) {
    const orgName = lead.organizationName;
    if (!orgName) continue;

    const existing = companyMap.get(orgName);
    if (existing) {
      existing.leadsCount++;
      if (lead.enrichmentRunId) {
        existing.enrichmentRunIds.push(lead.enrichmentRunId);
      }
    } else {
      companyMap.set(orgName, {
        name: orgName,
        domain: lead.organizationDomain || null,
        industry: lead.organizationIndustry || null,
        employeeCount: lead.organizationSize || null,
        leadsCount: 1,
        enrichmentRunIds: lead.enrichmentRunId ? [lead.enrichmentRunId] : [],
      });
    }
  }

  // Convert to array with IDs
  return Array.from(companyMap.entries()).map(([name, data], index) => ({
    id: `company-${index}`,
    ...data,
  }));
}

export interface ModelStats {
  model: string;
  count: number;
  runIds: string[];
}

/**
 * Get email generation stats grouped by model (no auth — internal network trust)
 */
export async function getStatsByModel(runIds: string[]): Promise<ModelStats[]> {
  if (runIds.length === 0) return [];

  try {
    const response = await fetch(`${EMAILGENERATION_SERVICE_URL}/stats/by-model`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ runIds }),
    });

    if (!response.ok) {
      console.warn(`Stats by model fetch failed: ${response.status}`);
      return [];
    }

    const data = await response.json();
    return data.stats || [];
  } catch (error) {
    console.warn("Stats by model fetch error:", error);
    return [];
  }
}

export async function getAggregatedStats(
  runIds: string[],
  clerkOrgId: string
): Promise<AggregatedStats> {
  if (runIds.length === 0) {
    return {
      leadsFound: 0,
      emailsGenerated: 0,
      emailsSent: 0,
      emailsOpened: 0,
      emailsClicked: 0,
      emailsReplied: 0,
      emailsBounced: 0,
      repliesWillingToMeet: 0,
      repliesInterested: 0,
      repliesNotInterested: 0,
      repliesOutOfOffice: 0,
      repliesUnsubscribe: 0,
    };
  }

  const body = { runIds };

  // Fetch stats from all services in parallel
  const [apolloStats, emailGenStats, postmarkStats] = await Promise.all([
    fetchStats<ApolloStats>(`${APOLLO_SERVICE_URL}/stats`, clerkOrgId, body, APOLLO_SERVICE_API_KEY),
    fetchStats<EmailGenStats>(`${EMAILGENERATION_SERVICE_URL}/stats`, clerkOrgId, body, EMAILGENERATION_SERVICE_API_KEY),
    fetchStats<PostmarkStats>(`${POSTMARK_SERVICE_URL}/stats`, clerkOrgId, body, POSTMARK_SERVICE_API_KEY),
  ]);

  return {
    leadsFound: apolloStats?.leadsFound || 0,
    emailsGenerated: emailGenStats?.emailsGenerated || 0,
    emailsSent: postmarkStats?.emailsSent || 0,
    emailsOpened: postmarkStats?.emailsOpened || 0,
    emailsClicked: postmarkStats?.emailsClicked || 0,
    emailsReplied: postmarkStats?.emailsReplied || 0,
    emailsBounced: postmarkStats?.emailsBounced || 0,
    repliesWillingToMeet: postmarkStats?.repliesWillingToMeet || 0,
    repliesInterested: postmarkStats?.repliesInterested || 0,
    repliesNotInterested: postmarkStats?.repliesNotInterested || 0,
    repliesOutOfOffice: postmarkStats?.repliesOutOfOffice || 0,
    repliesUnsubscribe: postmarkStats?.repliesUnsubscribe || 0,
  };
}
