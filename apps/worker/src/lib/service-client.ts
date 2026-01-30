/**
 * Generic service client for calling other microservices
 */

const SERVICE_SECRET_KEY = process.env.SERVICE_SECRET_KEY;

interface ServiceCallOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  clerkOrgId?: string;
}

export async function callService(
  serviceUrl: string,
  path: string,
  options: ServiceCallOptions
): Promise<unknown> {
  const { method = "GET", body, clerkOrgId } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Service-Secret": SERVICE_SECRET_KEY!,
  };
  
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

// Service-specific clients
export const campaignService = {
  url: process.env.CAMPAIGN_SERVICE_URL || "http://localhost:3003",
  
  async createRun(campaignId: string) {
    return callService(this.url, `/campaigns/${campaignId}/runs`, {
      method: "POST",
      clerkOrgId: "", // Runs are created by internal scheduler
    });
  },
  
  async updateRun(runId: string, data: { status?: string; errorMessage?: string }) {
    return callService(this.url, `/runs/${runId}`, {
      method: "PATCH",
      body: data,
      clerkOrgId: "",
    });
  },
};

export const apolloService = {
  url: process.env.APOLLO_SERVICE_URL || "http://localhost:3004",
  
  async search(clerkOrgId: string, data: unknown) {
    return callService(this.url, "/search", {
      method: "POST",
      body: data,
      clerkOrgId,
    });
  },
};

export const emailGenerationService = {
  url: process.env.EMAILGENERATION_SERVICE_URL || "http://localhost:3005",
  
  async generate(clerkOrgId: string, data: unknown) {
    return callService(this.url, "/generate", {
      method: "POST",
      body: data,
      clerkOrgId,
    });
  },
};

export const postmarkService = {
  url: process.env.POSTMARK_SERVICE_URL || "http://localhost:3010",
  
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
    });
  },
  
  /**
   * Get email status by message ID
   */
  async getStatus(messageId: string) {
    return callService(this.url, `/status/${messageId}`, {
      method: "GET",
    });
  },
  
  /**
   * Get emails by campaign run
   */
  async getByCampaignRun(campaignRunId: string) {
    return callService(this.url, `/status/by-campaign/${campaignRunId}`, {
      method: "GET",
    });
  },
};

export const companyService = {
  url: process.env.COMPANY_SERVICE_URL || "http://localhost:3008",
  
  async scrape(clerkOrgId: string, url: string) {
    return callService(this.url, "/scrape", {
      method: "POST",
      body: { url },
      clerkOrgId,
    });
  },
};
