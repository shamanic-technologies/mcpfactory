import { describe, it, expect, beforeAll } from "vitest";

const SERVICE_URL = process.env.REPLY_QUALIFICATION_SERVICE_URL || "https://reply-qualification.mcpfactory.org";
const API_KEY = process.env.REPLY_QUALIFICATION_SERVICE_API_KEY;

describe("Reply Qualification Service - E2E", () => {
  beforeAll(() => {
    if (!API_KEY) {
      console.warn("⚠️  REPLY_QUALIFICATION_SERVICE_API_KEY not set - skipping authenticated tests");
    }
  });

  describe("Unauthenticated requests", () => {
    it("should reject requests without API key", async () => {
      const response = await fetch(`${SERVICE_URL}/qualify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceService: "e2e-test",
          sourceOrgId: "test-org",
          fromEmail: "test@example.com",
          toEmail: "sales@test.com",
          bodyText: "Hello",
        }),
      });

      expect(response.status).toBe(401);
    });
  });

  describe("Authenticated requests", () => {
    it.skipIf(!API_KEY)("should qualify an interested reply", async () => {
      const response = await fetch(`${SERVICE_URL}/qualify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": API_KEY!,
        },
        body: JSON.stringify({
          sourceService: "e2e-test",
          sourceOrgId: "test-org-e2e",
          sourceRefId: "test-run-001",
          fromEmail: "lead@example.com",
          toEmail: "sales@company.com",
          subject: "Re: Our services",
          bodyText: "Yes, I would love to schedule a call to discuss this further. How about next Tuesday at 2pm?",
        }),
      });

      expect(response.ok).toBe(true);
      
      const data = await response.json();
      console.log("Qualification result:", JSON.stringify(data, null, 2));

      expect(data.id).toBeDefined();
      expect(data.requestId).toBeDefined();
      expect(data.classification).toBeDefined();
      expect(["willing_to_meet", "interested"]).toContain(data.classification);
      expect(data.confidence).toBeGreaterThan(0.5);
      expect(data.usedByok).toBe(false); // Platform key used
      expect(data.costUsd).toBeGreaterThan(0);
    });

    it.skipIf(!API_KEY)("should qualify a not interested reply", async () => {
      const response = await fetch(`${SERVICE_URL}/qualify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": API_KEY!,
        },
        body: JSON.stringify({
          sourceService: "e2e-test",
          sourceOrgId: "test-org-e2e",
          fromEmail: "lead@example.com",
          toEmail: "sales@company.com",
          subject: "Re: Our services",
          bodyText: "Thanks but we are not interested at this time. Please remove me from your list.",
        }),
      });

      expect(response.ok).toBe(true);
      
      const data = await response.json();
      console.log("Qualification result:", JSON.stringify(data, null, 2));

      expect(["not_interested", "unsubscribe"]).toContain(data.classification);
    });

    it.skipIf(!API_KEY)("should qualify an out of office reply", async () => {
      const response = await fetch(`${SERVICE_URL}/qualify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": API_KEY!,
        },
        body: JSON.stringify({
          sourceService: "e2e-test",
          sourceOrgId: "test-org-e2e",
          fromEmail: "lead@example.com",
          toEmail: "sales@company.com",
          subject: "Out of Office: Re: Our services",
          bodyText: "I am currently out of the office until February 15th with limited access to email. I will respond to your message when I return.",
        }),
      });

      expect(response.ok).toBe(true);
      
      const data = await response.json();
      console.log("Qualification result:", JSON.stringify(data, null, 2));

      expect(data.classification).toBe("out_of_office");
    });
  });

  describe("BYOK (Bring Your Own Key)", () => {
    const BYOK_KEY = process.env.TEST_ANTHROPIC_API_KEY;

    it.skipIf(!API_KEY || !BYOK_KEY)("should use BYOK when provided", async () => {
      const response = await fetch(`${SERVICE_URL}/qualify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": API_KEY!,
        },
        body: JSON.stringify({
          sourceService: "e2e-test-byok",
          sourceOrgId: "test-org-byok",
          fromEmail: "lead@example.com",
          toEmail: "sales@company.com",
          subject: "Re: Hello",
          bodyText: "Sounds interesting, tell me more.",
          byokApiKey: BYOK_KEY,
        }),
      });

      expect(response.ok).toBe(true);
      
      const data = await response.json();
      console.log("BYOK result:", JSON.stringify(data, null, 2));

      expect(data.usedByok).toBe(true);
      expect(data.classification).toBeDefined();
    });
  });
});
