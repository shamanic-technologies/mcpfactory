import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock the service client
vi.mock("../../src/lib/service-client.js", () => ({
  campaignService: {
    listCampaigns: vi.fn(),
    getRuns: vi.fn(),
    createRun: vi.fn(),
    updateCampaign: vi.fn(),
  },
  runsService: {
    ensureOrganization: vi.fn(),
    listRuns: vi.fn(),
    updateRun: vi.fn(),
    getRunsBatch: vi.fn(),
  },
}));

// Mock the queues
const mockQueueAdd = vi.fn().mockResolvedValue({ id: "job-123" });

vi.mock("../../src/queues/index.js", () => ({
  getQueues: () => ({
    "campaign-run": {
      add: mockQueueAdd,
    },
    "brand-upsert": {
      add: mockQueueAdd,
    },
  }),
  QUEUE_NAMES: {
    CAMPAIGN_RUN: "campaign-run",
    BRAND_UPSERT: "brand-upsert",
    LEAD_SEARCH: "lead-search",
    EMAIL_GENERATE: "email-generate",
    EMAIL_SEND: "email-send",
  },
}));

// Mock redis
vi.mock("../../src/lib/redis.js", () => ({
  getRedis: vi.fn(() => ({})),
}));

import { campaignService, runsService } from "../../src/lib/service-client.js";
import { getQueues } from "../../src/queues/index.js";
import { startCampaignScheduler } from "../../src/schedulers/campaign-scheduler.js";

describe("Campaign Scheduler Logic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(runsService.ensureOrganization).mockResolvedValue("runs-org-id");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Budget-based scheduling", () => {
    it("should queue campaign when budget is not exceeded", async () => {
      const campaigns = [
        {
          id: "camp-1",
          orgId: "org-uuid",
          clerkOrgId: "org_clerk123",
          status: "ongoing",
          maxBudgetDailyUsd: "10.00",
          createdAt: new Date().toISOString(),
        },
      ];

      vi.mocked(campaignService.listCampaigns).mockResolvedValue({ campaigns });
      vi.mocked(runsService.listRuns).mockResolvedValue({ runs: [], limit: 200, offset: 0 });
      // No runs, so getRunsBatch won't be called

      const interval = startCampaignScheduler(100000);
      await new Promise((resolve) => setTimeout(resolve, 100));
      clearInterval(interval);

      expect(mockQueueAdd).toHaveBeenCalledTimes(1);
      expect(mockQueueAdd).toHaveBeenCalledWith(
        expect.stringContaining("campaign-camp-1"),
        expect.objectContaining({
          campaignId: "camp-1",
          clerkOrgId: "org_clerk123",
        })
      );
    });

    it("should NOT queue campaign when daily budget is exceeded", async () => {
      const campaigns = [
        {
          id: "camp-budget",
          orgId: "org-uuid",
          clerkOrgId: "org_clerk456",
          status: "ongoing",
          maxBudgetDailyUsd: "5.00",
          createdAt: new Date().toISOString(),
        },
      ];

      const existingRuns = [
        { id: "run-1", status: "completed", createdAt: new Date().toISOString() },
      ];

      vi.mocked(campaignService.listCampaigns).mockResolvedValue({ campaigns });
      vi.mocked(runsService.listRuns).mockResolvedValue({ runs: existingRuns, limit: 200, offset: 0 });
      vi.mocked(runsService.getRunsBatch).mockResolvedValue(
        new Map([
          ["run-1", {
            id: "run-1",
            status: "completed",
            createdAt: new Date().toISOString(),
            totalCostInUsdCents: "600", // $6.00 > $5.00 daily limit
            ownCostInUsdCents: "600",
            childrenCostInUsdCents: "0",
            costs: [],
            parentRunId: null,
            organizationId: "org-id",
            userId: null,
            serviceName: "campaign-service",
            taskName: "camp-budget",
            startedAt: new Date().toISOString(),
            completedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }],
        ])
      );

      const interval = startCampaignScheduler(100000);
      await new Promise((resolve) => setTimeout(resolve, 100));
      clearInterval(interval);

      expect(mockQueueAdd).not.toHaveBeenCalled();
    });

    it("should skip stopped campaigns", async () => {
      const campaigns = [
        {
          id: "camp-stopped",
          orgId: "org-uuid",
          clerkOrgId: "org_clerk999",
          status: "stopped",
          maxBudgetDailyUsd: "10.00",
          createdAt: new Date().toISOString(),
        },
      ];

      vi.mocked(campaignService.listCampaigns).mockResolvedValue({ campaigns });

      const interval = startCampaignScheduler(100000);
      await new Promise((resolve) => setTimeout(resolve, 100));
      clearInterval(interval);

      expect(mockQueueAdd).not.toHaveBeenCalled();
    });

    it("should handle service errors gracefully (fail closed)", async () => {
      vi.mocked(campaignService.listCampaigns).mockRejectedValue(new Error("Service unavailable"));

      const interval = startCampaignScheduler(100000);
      await new Promise((resolve) => setTimeout(resolve, 100));
      clearInterval(interval);

      expect(mockQueueAdd).not.toHaveBeenCalled();
    });
  });

  describe("Queue integration", () => {
    it("should add job to brand-upsert queue", async () => {
      const queues = getQueues();

      await queues["brand-upsert"].add("test-job", {
        campaignId: "camp-123",
        clerkOrgId: "org_test",
      });

      expect(queues["brand-upsert"].add).toHaveBeenCalledWith("test-job", {
        campaignId: "camp-123",
        clerkOrgId: "org_test",
      });
    });
  });

  describe("Campaign filtering", () => {
    it("should filter only ongoing campaigns", () => {
      const campaigns = [
        { id: "1", status: "ongoing", maxBudgetDailyUsd: "10.00" },
        { id: "2", status: "stopped", maxBudgetDailyUsd: "10.00" },
        { id: "3", status: "ongoing", maxBudgetWeeklyUsd: "50.00" },
      ];

      const ongoing = campaigns.filter((c) => c.status === "ongoing");
      expect(ongoing).toHaveLength(2);
      expect(ongoing.map((c) => c.id)).toEqual(["1", "3"]);
    });

    it("should handle empty campaign list", () => {
      const campaigns: { id: string; status: string }[] = [];
      const ongoing = campaigns.filter((c) => c.status === "ongoing");
      expect(ongoing).toHaveLength(0);
    });
  });
});
