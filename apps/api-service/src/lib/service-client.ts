/**
 * Internal service client for calling other mcpfactory services
 */

const SERVICE_SECRET = process.env.API_SERVICE_API_KEY || "";

interface ServiceCallOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
}

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
      "X-Service-Secret": SERVICE_SECRET,
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

// Service URLs from environment
export const services = {
  keys: process.env.KEYS_SERVICE_URL || "http://localhost:3001",
  apollo: process.env.APOLLO_SERVICE_URL || "http://localhost:3003",
  campaign: process.env.CAMPAIGN_SERVICE_URL || "http://localhost:3004",
  emailgen: process.env.EMAILGEN_SERVICE_URL || "http://localhost:3005",
  conversation: process.env.CONVERSATION_SERVICE_URL || "http://localhost:3006",
  client: process.env.CLIENT_SERVICE_URL || "http://localhost:3002",
};
