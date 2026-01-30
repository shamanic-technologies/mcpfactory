/**
 * Client for fetching BYOK keys from keys-service
 */
export async function getByokKey(
  clerkOrgId: string,
  provider: string
): Promise<string> {
  const keysServiceUrl = process.env.KEYS_SERVICE_URL || "http://localhost:3001";
  const serviceKey = process.env.SERVICE_SECRET_KEY;

  if (!serviceKey) {
    throw new Error("SERVICE_SECRET_KEY not configured");
  }

  const response = await fetch(
    `${keysServiceUrl}/byok/${provider}/decrypt?clerkOrgId=${clerkOrgId}`,
    {
      headers: {
        "X-Service-Key": serviceKey,
      },
    }
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
