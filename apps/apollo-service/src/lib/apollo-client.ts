const APOLLO_API_BASE = "https://api.apollo.io/api/v1";

export interface ApolloSearchParams {
  person_titles?: string[];
  q_organization_keyword_tags?: string[];
  organization_locations?: string[];
  organization_num_employees_ranges?: string[];
  q_organization_industry_tag_ids?: string[];
  q_keywords?: string;
  page?: number;
  per_page?: number;
}

export interface ApolloPerson {
  id: string;
  first_name: string;
  last_name: string;
  name: string;
  email: string;
  email_status: string;
  title: string;
  linkedin_url: string;
  organization?: {
    id: string;
    name: string;
    website_url: string;
    primary_domain: string;
    industry: string;
    estimated_num_employees: number;
    annual_revenue: number;
  };
}

export interface ApolloSearchResponse {
  people: ApolloPerson[];
  total_entries: number;
  // Legacy format (deprecated endpoint)
  pagination?: {
    page: number;
    per_page: number;
    total_entries: number;
    total_pages: number;
  };
}

export interface ApolloEnrichResponse {
  person: ApolloPerson;
}

/**
 * Search for people using Apollo API
 * Uses the new api_search endpoint (mixed_people/search is deprecated)
 */
export async function searchPeople(
  apiKey: string,
  params: ApolloSearchParams
): Promise<ApolloSearchResponse> {
  const response = await fetch(`${APOLLO_API_BASE}/mixed_people/api_search`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Api-Key": apiKey,
    },
    body: JSON.stringify({
      ...params,
      page: params.page || 1,
      per_page: params.per_page || 25,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Apollo search failed: ${response.status} - ${error}`);
  }

  return response.json();
}

/**
 * Enrich a single person using Apollo API
 */
export async function enrichPerson(
  apiKey: string,
  personId: string
): Promise<ApolloEnrichResponse> {
  const response = await fetch(`${APOLLO_API_BASE}/people/match`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Api-Key": apiKey,
    },
    body: JSON.stringify({
      id: personId,
      reveal_personal_emails: false,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Apollo enrich failed: ${response.status} - ${error}`);
  }

  return response.json();
}

/**
 * Bulk enrich people using Apollo API
 */
export async function bulkEnrichPeople(
  apiKey: string,
  personIds: string[]
): Promise<{ matches: ApolloPerson[] }> {
  const response = await fetch(`${APOLLO_API_BASE}/people/bulk_match`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Api-Key": apiKey,
    },
    body: JSON.stringify({
      details: personIds.map((id) => ({ id })),
      reveal_personal_emails: false,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Apollo bulk enrich failed: ${response.status} - ${error}`);
  }

  return response.json();
}
