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
  totalCostUsd: string;
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

export async function getAggregatedStats(
  campaignRunIds: string[],
  clerkOrgId: string
): Promise<AggregatedStats> {
  if (campaignRunIds.length === 0) {
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

  const body = { campaignRunIds };

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
