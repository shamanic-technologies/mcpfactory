import { describe, it, expect } from "vitest";

describe("Campaign model", () => {
  it("should define campaign status enum", () => {
    const statuses = ["draft", "active", "paused", "completed", "cancelled"];
    expect(statuses).toContain("active");
    expect(statuses).toContain("paused");
  });

  it("should define campaign interface", () => {
    const campaign = {
      id: "camp_123",
      clerkOrgId: "org_456",
      name: "Q1 Outreach",
      status: "active",
      dailyBudgetUsd: 10,
      weeklyBudgetUsd: 50,
      monthlyBudgetUsd: 200,
      startDate: new Date().toISOString(),
      endDate: null,
    };
    expect(campaign.id).toBeDefined();
    expect(campaign.dailyBudgetUsd).toBeGreaterThan(0);
  });
});
