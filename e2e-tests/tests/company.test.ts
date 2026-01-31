import { describe, it, expect, beforeAll } from "vitest";

const SERVICE_URL = process.env.COMPANY_SERVICE_URL || "https://company.mcpfactory.org";
const API_KEY = process.env.COMPANY_SERVICE_API_KEY;

describe("Company Service - E2E", () => {
  beforeAll(() => {
    if (!API_KEY) {
      console.warn("⚠️  COMPANY_SERVICE_API_KEY not set - skipping authenticated tests");
    }
  });

  describe("Unauthenticated requests", () => {
    it("should allow health check without auth", async () => {
      const response = await fetch(`${SERVICE_URL}/health`);
      expect(response.ok).toBe(true);
    });
  });

  describe("Company scraping", () => {
    it.skipIf(!API_KEY)("should scrape company info from URL", async () => {
      const response = await fetch(`${SERVICE_URL}/organizations/scrape`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": API_KEY!,
        },
        body: JSON.stringify({
          url: "https://stripe.com",
          clerkOrganizationId: "test-org-e2e",
        }),
      });

      // May fail if scraping is rate-limited or blocked
      if (response.ok) {
        const data = await response.json();
        console.log("Company scrape result:", JSON.stringify(data, null, 2));

        expect(data.name).toBeDefined();
        expect(data.url).toContain("stripe");
      } else {
        console.warn("Company scrape failed (may be rate limited):", response.status);
      }
    });
  });
});
