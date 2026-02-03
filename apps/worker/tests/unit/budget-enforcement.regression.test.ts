import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Run, RunWithCosts } from "@mcpfactory/runs-client";

// Mock the service client
vi.mock("../../src/lib/service-client.js", () => ({
  campaignService: {
    listCampaigns: vi.fn(),
    updateCampaign: vi.fn(),
  },
  runsService: {
    ensureOrganization: vi.fn(),
    listRuns: vi.fn(),
    updateRun: vi.fn(),
    getRunsBatch: vi.fn(),
  },
}));

vi.mock("../../src/queues/index.js", () => ({
  getQueues: () => ({}),
  QUEUE_NAMES: {},
}));

vi.mock("../../src/lib/redis.js", () => ({
  getRedis: vi.fn(() => ({})),
}));

import { runsService } from "../../src/lib/service-client.js";
import {
  getBudgetWindows,
  isBudgetExceeded,
  type Campaign,
} from "../../src/schedulers/campaign-scheduler.js";

function makeRun(overrides: Partial<Run> = {}): Run {
  return {
    id: `run-${Math.random().toString(36).slice(2)}`,
    parentRunId: null,
    organizationId: "org-id",
    userId: null,
    serviceName: "campaign-service",
    taskName: "campaign-id",
    status: "completed",
    startedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

function makeRunWithCosts(run: Run, totalCostCents: number): RunWithCosts {
  return {
    ...run,
    costs: [],
    ownCostInUsdCents: String(totalCostCents),
    childrenCostInUsdCents: "0",
    totalCostInUsdCents: String(totalCostCents),
  };
}

function makeCampaign(overrides: Partial<Campaign> = {}): Campaign {
  return {
    id: "campaign-1",
    orgId: "org-uuid",
    clerkOrgId: "org_clerk123",
    status: "ongoing",
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("Budget Enforcement", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getBudgetWindows", () => {
    it("should return daily window when maxBudgetDailyUsd is set", () => {
      const campaign = makeCampaign({ maxBudgetDailyUsd: "10.00" });
      const windows = getBudgetWindows(campaign);
      expect(windows).toHaveLength(1);
      expect(windows[0].label).toBe("daily");
      expect(windows[0].limitUsd).toBe(10);
      expect(windows[0].startedAfter).toBeInstanceOf(Date);
    });

    it("should return weekly window when maxBudgetWeeklyUsd is set", () => {
      const campaign = makeCampaign({ maxBudgetWeeklyUsd: "50.00" });
      const windows = getBudgetWindows(campaign);
      expect(windows).toHaveLength(1);
      expect(windows[0].label).toBe("weekly");
      expect(windows[0].limitUsd).toBe(50);
    });

    it("should return monthly window when maxBudgetMonthlyUsd is set", () => {
      const campaign = makeCampaign({ maxBudgetMonthlyUsd: "200.00" });
      const windows = getBudgetWindows(campaign);
      expect(windows).toHaveLength(1);
      expect(windows[0].label).toBe("monthly");
      expect(windows[0].limitUsd).toBe(200);
    });

    it("should return total window (null startedAfter) when maxBudgetTotalUsd is set", () => {
      const campaign = makeCampaign({ maxBudgetTotalUsd: "1000.00" });
      const windows = getBudgetWindows(campaign);
      expect(windows).toHaveLength(1);
      expect(windows[0].label).toBe("total");
      expect(windows[0].limitUsd).toBe(1000);
      expect(windows[0].startedAfter).toBeNull();
    });

    it("should return multiple windows when multiple budgets are set", () => {
      const campaign = makeCampaign({
        maxBudgetDailyUsd: "10.00",
        maxBudgetMonthlyUsd: "200.00",
        maxBudgetTotalUsd: "1000.00",
      });
      const windows = getBudgetWindows(campaign);
      expect(windows).toHaveLength(3);
      expect(windows.map(w => w.label)).toEqual(["daily", "monthly", "total"]);
    });

    it("should return empty array when no budget fields are set", () => {
      const campaign = makeCampaign();
      const windows = getBudgetWindows(campaign);
      expect(windows).toHaveLength(0);
    });
  });

  describe("isBudgetExceeded", () => {
    it("should return not exceeded when no runs exist", async () => {
      const campaign = makeCampaign({ maxBudgetDailyUsd: "10.00" });
      const result = await isBudgetExceeded(campaign, []);
      expect(result.exceeded).toBe(false);
    });

    it("should return exceeded when daily budget is hit", async () => {
      const campaign = makeCampaign({ maxBudgetDailyUsd: "5.00" });
      const run = makeRun({ createdAt: new Date().toISOString() });

      vi.mocked(runsService.getRunsBatch).mockResolvedValue(
        new Map([[run.id, makeRunWithCosts(run, 600)]]) // $6.00 > $5.00
      );

      const result = await isBudgetExceeded(campaign, [run]);
      expect(result.exceeded).toBe(true);
      expect(result.which).toBe("daily");
    });

    it("should return exceeded when weekly budget is hit", async () => {
      const campaign = makeCampaign({ maxBudgetWeeklyUsd: "20.00" });
      const run = makeRun({ createdAt: new Date().toISOString() });

      vi.mocked(runsService.getRunsBatch).mockResolvedValue(
        new Map([[run.id, makeRunWithCosts(run, 2500)]]) // $25.00 > $20.00
      );

      const result = await isBudgetExceeded(campaign, [run]);
      expect(result.exceeded).toBe(true);
      expect(result.which).toBe("weekly");
    });

    it("should return exceeded when monthly budget is hit", async () => {
      const campaign = makeCampaign({ maxBudgetMonthlyUsd: "100.00" });
      const run = makeRun({ createdAt: new Date().toISOString() });

      vi.mocked(runsService.getRunsBatch).mockResolvedValue(
        new Map([[run.id, makeRunWithCosts(run, 15000)]]) // $150.00 > $100.00
      );

      const result = await isBudgetExceeded(campaign, [run]);
      expect(result.exceeded).toBe(true);
      expect(result.which).toBe("monthly");
    });

    it("should return exceeded when total budget is hit", async () => {
      const campaign = makeCampaign({ maxBudgetTotalUsd: "50.00" });
      const run = makeRun({ createdAt: new Date().toISOString() });

      vi.mocked(runsService.getRunsBatch).mockResolvedValue(
        new Map([[run.id, makeRunWithCosts(run, 5100)]]) // $51.00 > $50.00
      );

      const result = await isBudgetExceeded(campaign, [run]);
      expect(result.exceeded).toBe(true);
      expect(result.which).toBe("total");
    });

    it("should return not exceeded when spend is under all limits", async () => {
      const campaign = makeCampaign({
        maxBudgetDailyUsd: "10.00",
        maxBudgetMonthlyUsd: "200.00",
      });
      const run = makeRun({ createdAt: new Date().toISOString() });

      vi.mocked(runsService.getRunsBatch).mockResolvedValue(
        new Map([[run.id, makeRunWithCosts(run, 300)]]) // $3.00 < both limits
      );

      const result = await isBudgetExceeded(campaign, [run]);
      expect(result.exceeded).toBe(false);
    });

    it("should block on first exceeded window when multiple budgets set", async () => {
      const campaign = makeCampaign({
        maxBudgetDailyUsd: "5.00",  // This will be exceeded
        maxBudgetMonthlyUsd: "200.00",  // This won't
      });
      const run = makeRun({ createdAt: new Date().toISOString() });

      vi.mocked(runsService.getRunsBatch).mockResolvedValue(
        new Map([[run.id, makeRunWithCosts(run, 600)]]) // $6.00 > $5.00 daily
      );

      const result = await isBudgetExceeded(campaign, [run]);
      expect(result.exceeded).toBe(true);
      expect(result.which).toBe("daily");
    });

    it("should fail closed when runs-service getRunsBatch throws", async () => {
      const campaign = makeCampaign({ maxBudgetDailyUsd: "10.00" });
      const run = makeRun({ createdAt: new Date().toISOString() });

      vi.mocked(runsService.getRunsBatch).mockRejectedValue(new Error("Service down"));

      // isBudgetExceeded will throw, and shouldRunCampaign catches it and fails closed
      await expect(isBudgetExceeded(campaign, [run])).rejects.toThrow("Service down");
    });

    it("should block run when no budget fields are set", async () => {
      const campaign = makeCampaign(); // No budget fields
      const result = await isBudgetExceeded(campaign, []);
      expect(result.exceeded).toBe(true);
    });

    it("should ignore runs outside daily window", async () => {
      const campaign = makeCampaign({ maxBudgetDailyUsd: "5.00" });

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const oldRun = makeRun({ createdAt: yesterday.toISOString() });
      const todayRun = makeRun({ createdAt: new Date().toISOString() });

      vi.mocked(runsService.getRunsBatch).mockResolvedValue(
        new Map([
          [oldRun.id, makeRunWithCosts(oldRun, 400)],   // $4.00 yesterday
          [todayRun.id, makeRunWithCosts(todayRun, 200)], // $2.00 today
        ])
      );

      // Only today's $2.00 should count against daily limit of $5.00
      const result = await isBudgetExceeded(campaign, [oldRun, todayRun]);
      expect(result.exceeded).toBe(false);
    });

    it("should sum costs across multiple runs in window", async () => {
      const campaign = makeCampaign({ maxBudgetDailyUsd: "5.00" });

      const run1 = makeRun({ createdAt: new Date().toISOString() });
      const run2 = makeRun({ createdAt: new Date().toISOString() });

      vi.mocked(runsService.getRunsBatch).mockResolvedValue(
        new Map([
          [run1.id, makeRunWithCosts(run1, 300)], // $3.00
          [run2.id, makeRunWithCosts(run2, 300)], // $3.00 → total $6.00 > $5.00
        ])
      );

      const result = await isBudgetExceeded(campaign, [run1, run2]);
      expect(result.exceeded).toBe(true);
      expect(result.which).toBe("daily");
      expect(result.spendUsd).toBe(6);
    });
  });
});
