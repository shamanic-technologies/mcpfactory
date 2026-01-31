/**
 * Internal service client for calling other mcpfactory services
 * No auth needed for internal services (Railway private networking)
 */

// Internal services (no auth - private network)
export const services = {
  keys: process.env.KEYS_SERVICE_URL || "http://localhost:3001",
  apollo: process.env.APOLLO_SERVICE_URL || "http://localhost:3003",
  campaign: process.env.CAMPAIGN_SERVICE_URL || "http://localhost:3004",
  emailgen: process.env.EMAILGENERATION_SERVICE_URL || "http://localhost:3005",
  client: process.env.CLIENT_SERVICE_URL || "http://localhost:3002",
};

// External services (need API key)
export const externalServices = {
  replyQualification: {
    url: process.env.REPLY_QUALIFICATION_SERVICE_URL || "http://localhost:3006",
    apiKey: process.env.REPLY_QUALIFICATION_SERVICE_API_KEY || "",
  },
  scraping: {
    url: process.env.SCRAPING_SERVICE_URL || "http://localhost:3010",
    apiKey: process.env.SCRAPING_SERVICE_API_KEY || "",
  },
  postmark: {
    url: process.env.POSTMARK_SERVICE_URL || "http://localhost:3009",
    apiKey: process.env.POSTMARK_SERVICE_API_KEY || "",
  },
};

interface ServiceCallOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
}

// Call internal service (no auth)
export async function callService<T>(
  serviceUrl: string,
  path: string,
  options: ServiceCallOptions = {}
): Promise<T> {
  const { method = "GET", body, headers = {} } = options;

  const url = `${serviceUrl}${path}`;

  const response = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || `Service call failed: ${response.status}`);
  }

  return response.json();
}

// Call external service (with API key)
export async function callExternalService<T>(
  service: { url: string; apiKey: string },
  path: string,
  options: ServiceCallOptions = {}
): Promise<T> {
  const { method = "GET", body, headers = {} } = options;

  const url = `${service.url}${path}`;

  console.log(`[callExternalService] ${method} ${url}`);

  try {
    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": service.apiKey,
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    console.log(`[callExternalService] Response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`[callExternalService] Error response: ${errorText}`);
      try {
        const errorJson = JSON.parse(errorText);
        throw new Error(errorJson.error || `Service call failed: ${response.status}`);
      } catch {
        throw new Error(`Service call failed: ${response.status} - ${errorText}`);
      }
    }

    return response.json();
  } catch (error: any) {
    console.error(`[callExternalService] Fetch error:`, error.message);
    throw error;
  }
}
