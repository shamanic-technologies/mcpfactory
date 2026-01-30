/**
 * In-memory cache for Apollo reference data (24h TTL)
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// Cache keyed by orgId
const industriesCache = new Map<string, CacheEntry<ApolloIndustry[]>>();
const employeeRangesCache = new Map<string, CacheEntry<ApolloEmployeeRange[]>>();

export interface ApolloIndustry {
  id: string;
  name: string;
  tag_id: string;
}

export interface ApolloEmployeeRange {
  label: string;
  value: string; // e.g., "1,10"
}

const APOLLO_API_BASE = "https://api.apollo.io/api/v1";

/**
 * Fetch industries from Apollo API with 24h cache
 */
export async function getIndustries(
  apiKey: string,
  orgId: string
): Promise<ApolloIndustry[]> {
  const cached = industriesCache.get(orgId);
  
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  const response = await fetch(`${APOLLO_API_BASE}/industries`, {
    headers: {
      "X-Api-Key": apiKey,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch industries: ${response.status}`);
  }

  const data = await response.json();
  const industries: ApolloIndustry[] = data.industries || [];

  industriesCache.set(orgId, {
    data: industries,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });

  return industries;
}

/**
 * Get employee ranges (static values from Apollo docs)
 */
export async function getEmployeeRanges(orgId: string): Promise<ApolloEmployeeRange[]> {
  const cached = employeeRangesCache.get(orgId);
  
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  // These are the standard Apollo employee ranges
  const ranges: ApolloEmployeeRange[] = [
    { label: "1-10", value: "1,10" },
    { label: "11-20", value: "11,20" },
    { label: "21-50", value: "21,50" },
    { label: "51-100", value: "51,100" },
    { label: "101-200", value: "101,200" },
    { label: "201-500", value: "201,500" },
    { label: "501-1000", value: "501,1000" },
    { label: "1001-2000", value: "1001,2000" },
    { label: "2001-5000", value: "2001,5000" },
    { label: "5001-10000", value: "5001,10000" },
    { label: "10001+", value: "10001," },
  ];

  employeeRangesCache.set(orgId, {
    data: ranges,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });

  return ranges;
}

/**
 * Clear cache for an org (useful for testing)
 */
export function clearCache(orgId: string): void {
  industriesCache.delete(orgId);
  employeeRangesCache.delete(orgId);
}
