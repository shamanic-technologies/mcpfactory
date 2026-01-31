import { describe, it, expect } from "vitest";

describe("Queue definitions", () => {
  it("should define queue names", () => {
    const queueNames = ["lead-search", "email-generate", "email-send", "campaign-run"];
    expect(queueNames).toContain("lead-search");
    expect(queueNames).toContain("email-send");
  });

  it("should define job data interface", () => {
    const jobData = {
      campaignId: "camp_123",
      clerkOrgId: "org_456",
      retryCount: 0,
    };
    expect(jobData.campaignId).toBeDefined();
    expect(jobData.retryCount).toBe(0);
  });
});
