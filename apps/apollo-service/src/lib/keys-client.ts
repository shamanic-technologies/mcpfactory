/**
 * Client for fetching BYOK keys from keys-service
 * Uses Railway private networking - no auth required
 */
export async function getByokKey(
  clerkOrgId: string,
  provider: string
): Promise<string> {
  const keysServiceUrl = process.env.KEYS_SERVICE_URL || "http://localhost:3001";

  const response = await fetch(
    `${keysServiceUrl}/internal/keys/${provider}/decrypt?clerkOrgId=${clerkOrgId}`
  );

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`${provider} key not configured for this organization`);
    }
    const error = await response.text();
    throw new Error(`Failed to fetch ${provider} key: ${error}`);
  }

  const data = await response.json();
  return data.key;
}
