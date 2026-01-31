/**
 * Generic service client for calling other microservices
 * 
 * Each service has its own API key env var:
 * - POSTMARK_SERVICE_API_KEY for postmark-service
 * - COMPANY_SERVICE_API_KEY for company-service
 * - CAMPAIGN_SERVICE_API_KEY for campaign-service
 * - etc.
 */

interface ServiceCallOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  clerkOrgId?: string;
  apiKey?: string; // Service-specific API key
}

export async function callService(
  serviceUrl: string,
  path: string,
  options: ServiceCallOptions
): Promise<unknown> {
  const { method = "GET", body, clerkOrgId, apiKey } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  
  // Add service secret for auth
  if (apiKey) {
    headers["X-API-Key"] = apiKey;
  }
  
  // Only add Clerk org header if provided (some services don't need it)
  if (clerkOrgId) {
    headers["X-Clerk-Org-Id"] = clerkOrgId;
  }

  const response = await fetch(`${serviceUrl}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Service call failed: ${response.status} - ${error}`);
  }

  return response.json();
}

// Service-specific clients with their own API keys

export const campaignService = {
  url: process.env.CAMPAIGN_SERVICE_URL || "http://localhost:3003",
  apiKey: process.env.CAMPAIGN_SERVICE_API_KEY,
  
  async createRun(campaignId: string) {
    return callService(this.url, `/campaigns/${campaignId}/runs`, {
      method: "POST",
      apiKey: this.apiKey,
      clerkOrgId: "", // Runs are created by internal scheduler
    });
  },
  
  async updateRun(runId: string, data: { status?: string; errorMessage?: string }) {
    return callService(this.url, `/runs/${runId}`, {
      method: "PATCH",
      body: data,
      apiKey: this.apiKey,
      clerkOrgId: "",
    });
  },
};

export const apolloService = {
  url: process.env.APOLLO_SERVICE_URL || "http://localhost:3004",
  apiKey: process.env.APOLLO_SERVICE_API_KEY,
  
  async search(clerkOrgId: string, data: unknown) {
    return callService(this.url, "/search", {
      method: "POST",
      body: data,
      apiKey: this.apiKey,
      clerkOrgId,
    });
  },
};

export const emailGenerationService = {
  url: process.env.EMAILGENERATION_SERVICE_URL || "http://localhost:3005",
  apiKey: process.env.EMAILGENERATION_SERVICE_API_KEY,
  
  async generate(clerkOrgId: string, data: unknown) {
    return callService(this.url, "/generate", {
      method: "POST",
      body: data,
      apiKey: this.apiKey,
      clerkOrgId,
    });
  },
};

export const postmarkService = {
  url: process.env.POSTMARK_SERVICE_URL || "https://postmark.mcpfactory.org",
  apiKey: process.env.POSTMARK_SERVICE_API_KEY,
  
  /**
   * Send an email via postmark-service
   */
  async send(data: {
    orgId?: string;
    campaignRunId?: string;
    from: string;
    to: string;
    subject: string;
    htmlBody?: string;
    textBody?: string;
    replyTo?: string;
    tag?: string;
    metadata?: Record<string, string>;
  }) {
    return callService(this.url, "/send", {
      method: "POST",
      body: data,
      apiKey: this.apiKey,
    });
  },
  
  /**
   * Get email status by message ID
   */
  async getStatus(messageId: string) {
    return callService(this.url, `/status/${messageId}`, {
      method: "GET",
      apiKey: this.apiKey,
    });
  },
  
  /**
   * Get emails by campaign run
   */
  async getByCampaignRun(campaignRunId: string) {
    return callService(this.url, `/status/by-campaign/${campaignRunId}`, {
      method: "GET",
      apiKey: this.apiKey,
    });
  },
};

export const companyService = {
  url: process.env.COMPANY_SERVICE_URL || "https://company.mcpfactory.org",
  apiKey: process.env.COMPANY_SERVICE_API_KEY,
  
  async scrape(clerkOrgId: string, url: string) {
    return callService(this.url, "/scrape", {
      method: "POST",
      body: { url },
      apiKey: this.apiKey,
      clerkOrgId,
    });
  },
};
