/**
 * API Client for calling MCPFactory services
 */

const API_BASE_URL = process.env.MCPFACTORY_API_URL || "https://api.mcpfactory.org";

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

// Store the current API key (set from request context)
let currentApiKey: string | null = null;

export function setApiKey(key: string | null): void {
  currentApiKey = key;
}

export function getApiKey(): string | null {
  return currentApiKey;
}

export async function callApi<T>(
  path: string,
  options: {
    method?: "GET" | "POST" | "PUT" | "DELETE";
    body?: unknown;
    apiKey?: string;
  } = {}
): Promise<ApiResponse<T>> {
  const { method = "GET", body, apiKey } = options;
  const key = apiKey || currentApiKey;

  if (!key) {
    return { error: "API key not provided. Include your API key in the Authorization header." };
  }

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": key,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({ error: "Request failed" })) as { error?: string };
      return { error: errorBody.error || `HTTP ${response.status}` };
    }

    const data = await response.json() as T;
    return { data };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Network error" };
  }
}

export function isConfigured(): boolean {
  return !!currentApiKey;
}

export function getConfigStatus(): { configured: boolean; apiUrl: string } {
  return {
    configured: !!currentApiKey,
    apiUrl: API_BASE_URL,
  };
}
