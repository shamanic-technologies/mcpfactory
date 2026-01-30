const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface ApiOptions {
  token: string;
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: Record<string, unknown>;
}

async function apiCall<T>(endpoint: string, options: ApiOptions): Promise<T> {
  const { token, method = "GET", body } = options;

  const response = await fetch(`${API_URL}${endpoint}`, {
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
export interface UserProfile {
  id: string;
  clerkUserId: string;
  apiKey: string;
  plan: string;
  createdAt: string;
}

export interface ByokKey {
  provider: string;
  maskedKey: string;
  createdAt: string;
  updatedAt: string;
}

// API functions
export async function getProfile(token: string): Promise<UserProfile> {
  return apiCall<UserProfile>("/me", { token });
}

export async function regenerateApiKey(token: string): Promise<{ apiKey: string }> {
  return apiCall<{ apiKey: string }>("/me/regenerate-key", { token, method: "POST" });
}

export async function getByokKeys(token: string): Promise<{ keys: ByokKey[] }> {
  return apiCall<{ keys: ByokKey[] }>("/keys", { token });
}

export async function setByokKey(
  token: string,
  provider: string,
  key: string
): Promise<{ provider: string; maskedKey: string }> {
  return apiCall<{ provider: string; maskedKey: string }>(`/keys/${provider}`, {
    token,
    method: "PUT",
    body: { key },
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
