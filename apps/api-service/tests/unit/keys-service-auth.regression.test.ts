/**
 * Regression test for: "Invalid service key" error when calling keys-service
 *
 * Issue: api-service was calling keys-service using callService() which doesn't
 * include X-API-Key header. But keys-service at the public URL requires
 * KEY_SERVICE_API_KEY for authentication.
 *
 * Fix: Move keys from internal services to external services and use
 * callExternalService() which includes X-API-Key header.
 */

import { describe, it, expect } from "vitest";
import { externalServices } from "../../src/lib/service-client.js";

describe("Keys service authentication", () => {
  it("should have keys in externalServices (not internal services)", () => {
    expect(externalServices.key).toBeDefined();
    expect(externalServices.key.url).toBeDefined();
    expect(externalServices.key.apiKey).toBeDefined();
  });

  it("should have KEY_SERVICE_API_KEY environment variable set", () => {
    expect(process.env.KEY_SERVICE_API_KEY).toBeDefined();
    expect(process.env.KEY_SERVICE_API_KEY).not.toBe("");
  });

  it("should include apiKey in keys service config", () => {
    // This ensures callExternalService will include X-API-Key header
    const keysService = externalServices.key;
    expect(keysService).toHaveProperty("apiKey");
    expect(typeof keysService.apiKey).toBe("string");
  });
});
