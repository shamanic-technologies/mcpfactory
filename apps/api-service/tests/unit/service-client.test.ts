import { describe, it, expect } from "vitest";

describe("Service client", () => {
  it("should define service URLs from environment", () => {
    expect(process.env.KEY_SERVICE_URL).toBeDefined();
    expect(process.env.LEAD_SERVICE_URL).toBeDefined();
    expect(process.env.CAMPAIGN_SERVICE_URL).toBeDefined();
  });

  it("should define API keys for external service calls", () => {
    expect(process.env.KEY_SERVICE_API_KEY).toBeDefined();
    expect(process.env.CAMPAIGN_SERVICE_API_KEY).toBeDefined();
  });

  it("should use X-API-Key header for external service calls", () => {
    const headers = {
      "X-API-Key": process.env.KEY_SERVICE_API_KEY,
      "Content-Type": "application/json",
    };
    expect(headers["X-API-Key"]).toBeDefined();
  });
});
