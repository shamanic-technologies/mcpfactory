/**
 * API Client for calling MCPFactory services
 */

const API_BASE_URL = process.env.MCPFACTORY_API_URL || "https://api.mcpfactory.org";
const API_KEY = process.env.MCPFACTORY_API_KEY;

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

export async function callApi<T>(
  path: string,
  options: {
    method?: "GET" | "POST" | "PUT" | "DELETE";
    body?: unknown;
  } = {}
): Promise<ApiResponse<T>> {
  const { method = "GET", body } = options;

  if (!API_KEY) {
    return { error: "MCPFACTORY_API_KEY not configured. Get your API key at https://dashboard.mcpfactory.org" };
  }

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
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
  return !!API_KEY;
}

export function getConfigStatus(): { configured: boolean; apiUrl: string } {
  return {
    configured: !!API_KEY,
    apiUrl: API_BASE_URL,
  };
}
