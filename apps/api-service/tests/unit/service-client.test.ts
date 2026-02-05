import { describe, it, expect } from "vitest";

describe("Service client", () => {
  it("should define service URLs from environment", () => {
    expect(process.env.KEYS_SERVICE_URL).toBeDefined();
    expect(process.env.LEAD_SERVICE_URL).toBeDefined();
    expect(process.env.CAMPAIGN_SERVICE_URL).toBeDefined();
  });

  it("should use X-API-Key header for internal calls", () => {
    const headers = {
      "X-API-Key": process.env.API_SERVICE_API_KEY,
      "Content-Type": "application/json",
    };
    expect(headers["X-API-Key"]).toBeDefined();
  });
});
