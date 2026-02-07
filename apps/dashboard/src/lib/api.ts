const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.mcpfactory.org";

interface ApiOptions {
  token: string;
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: Record<string, unknown>;
}

async function apiCall<T>(endpoint: string, options: ApiOptions): Promise<T> {
  const { token, method = "GET", body } = options;

  const response = await fetch(`${API_URL}/v1${endpoint}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Request failed" }));
    throw new Error(error.error || "Request failed");
  }

  return response.json();
}

// Types
export interface UserInfo {
  userId: string;
  orgId: string;
  authType: string;
  user: {
    id: string;
    clerkUserId: string;
    createdAt: string;
  } | null;
  org: {
    id: string;
    clerkOrgId: string;
    plan: string;
    createdAt: string;
  } | null;
}

export interface ApiKey {
  id: string;
  keyPrefix: string;
  name: string | null;
  createdAt: string;
  lastUsedAt: string | null;
}

export interface NewApiKey {
  id: string;
  key: string; // Full key, only shown once
  keyPrefix: string;
  name: string | null;
  message: string;
}

export interface ByokKey {
  provider: string;
  maskedKey: string;
  createdAt: string;
  updatedAt: string;
}

// User/Org info
export async function getMe(token: string): Promise<UserInfo> {
  return apiCall<UserInfo>("/me", { token });
}

// API Keys
export async function listApiKeys(token: string): Promise<{ keys: ApiKey[] }> {
  return apiCall<{ keys: ApiKey[] }>("/api-keys", { token });
}

export async function createApiKey(token: string, name?: string): Promise<NewApiKey> {
  return apiCall<NewApiKey>("/api-keys", { token, method: "POST", body: { name } });
}

export async function deleteApiKey(token: string, id: string): Promise<{ message: string }> {
  return apiCall<{ message: string }>(`/api-keys/${id}`, { token, method: "DELETE" });
}

// BYOK Keys
export async function listByokKeys(token: string): Promise<{ keys: ByokKey[] }> {
  return apiCall<{ keys: ByokKey[] }>("/keys", { token });
}

export async function setByokKey(
  token: string,
  provider: string,
  apiKey: string
): Promise<{ provider: string; maskedKey: string }> {
  return apiCall<{ provider: string; maskedKey: string }>("/keys", {
    token,
    method: "POST",
    body: { provider, apiKey },
  });
}

export async function deleteByokKey(
  token: string,
  provider: string
): Promise<{ message: string }> {
  return apiCall<{ message: string }>(`/keys/${provider}`, {
    token,
    method: "DELETE",
  });
}

// Session API Key (Foxy chat)
export interface SessionApiKey {
  id: string;
  key: string;
  keyPrefix: string;
  name: string;
}

export async function getOrCreateSessionKey(token: string): Promise<SessionApiKey> {
  return apiCall<SessionApiKey>("/api-keys/session", { token, method: "POST" });
}

// Activity tracking
export async function trackActivity(token: string): Promise<{ ok: boolean }> {
  return apiCall<{ ok: boolean }>("/activity", { token, method: "POST" });
}

// Campaigns
export interface Campaign {
  id: string;
  name: string;
  status: string;
  personTitles: string[] | null;
  organizationLocations: string[] | null;
  maxBudgetDailyUsd: string | null;
  maxBudgetWeeklyUsd: string | null;
  maxBudgetMonthlyUsd: string | null;
  maxBudgetTotalUsd: string | null;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CampaignStats {
  campaignId: string;
  totalCostInUsdCents?: string | null;
  leadsFound: number;
  emailsGenerated: number;
  emailsSent: number;
  emailsOpened: number;
  emailsClicked: number;
  emailsReplied: number;
  emailsBounced: number;
  // Reply classifications
  repliesWillingToMeet?: number;
  repliesInterested?: number;
  repliesNotInterested?: number;
  repliesOutOfOffice?: number;
  repliesUnsubscribe?: number;
}

export async function listCampaigns(token: string): Promise<{ campaigns: Campaign[] }> {
  return apiCall<{ campaigns: Campaign[] }>("/campaigns", { token });
}

export async function getCampaignStats(token: string, campaignId: string): Promise<CampaignStats> {
  return apiCall<CampaignStats>(`/campaigns/${campaignId}/stats`, { token });
}

export async function getCampaignBatchStats(
  token: string,
  campaignIds: string[]
): Promise<Record<string, CampaignStats>> {
  const result = await apiCall<{ stats: Record<string, CampaignStats> }>("/campaigns/batch-stats", {
    token,
    method: "POST",
    body: { campaignIds },
  });
  return result.stats;
}

export async function stopCampaign(token: string, campaignId: string): Promise<{ campaign: Campaign }> {
  return apiCall<{ campaign: Campaign }>(`/campaigns/${campaignId}/stop`, { token, method: "POST" });
}

export async function resumeCampaign(token: string, campaignId: string): Promise<{ campaign: Campaign }> {
  return apiCall<{ campaign: Campaign }>(`/campaigns/${campaignId}/resume`, { token, method: "POST" });
}
