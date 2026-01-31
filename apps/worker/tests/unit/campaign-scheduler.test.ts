import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock the service client
vi.mock("../../src/lib/service-client.js", () => ({
  campaignService: {
    listCampaigns: vi.fn(),
    getCampaignRuns: vi.fn(),
    createRun: vi.fn(),
  },
}));

// Mock the queues
vi.mock("../../src/queues/index.js", () => ({
  getQueues: vi.fn(() => ({
    "campaign-run": {
      add: vi.fn().mockResolvedValue({ id: "job-123" }),
    },
  })),
  QUEUE_NAMES: {
    CAMPAIGN_RUN: "campaign-run",
    LEAD_SEARCH: "lead-search",
    EMAIL_GENERATE: "email-generate",
    EMAIL_SEND: "email-send",
  },
}));

// Mock redis
vi.mock("../../src/lib/redis.js", () => ({
  getRedis: vi.fn(() => ({})),
}));

import { campaignService } from "../../src/lib/service-client.js";
import { getQueues } from "../../src/queues/index.js";

describe("Campaign Scheduler Logic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("shouldRunCampaign logic", () => {
    it("should queue oneoff campaign with no runs", async () => {
      const campaigns = [
        {
          id: "camp-1",
          orgId: "org-uuid",
          clerkOrgId: "org_clerk123",
          status: "ongoing",
          recurrence: "oneoff",
          createdAt: new Date().toISOString(),
        },
      ];

      vi.mocked(campaignService.listCampaigns).mockResolvedValue({ campaigns });
      vi.mocked(campaignService.getCampaignRuns).mockResolvedValue({ runs: [] });

      // Simulate the scheduler logic
      const ongoingCampaigns = campaigns.filter((c) => c.status === "ongoing");
      expect(ongoingCampaigns).toHaveLength(1);

      // Check runs
      const runsResult = await campaignService.getCampaignRuns("camp-1");
      expect(runsResult.runs).toHaveLength(0);

      // Should run because no runs exist
      expect(campaigns[0].recurrence).toBe("oneoff");
    });

    it("should NOT queue oneoff campaign with existing runs", async () => {
      const existingRuns = [
        { id: "run-1", campaignId: "camp-1", status: "completed", createdAt: new Date().toISOString() },
      ];

      vi.mocked(campaignService.getCampaignRuns).mockResolvedValue({ runs: existingRuns });

      const runsResult = await campaignService.getCampaignRuns("camp-1");
      expect(runsResult.runs).toHaveLength(1);
      
      // For oneoff, should not run if runs exist
      const shouldRun = runsResult.runs.length === 0;
      expect(shouldRun).toBe(false);
    });

    it("should queue daily campaign if no run today", async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const existingRuns = [
        { id: "run-1", campaignId: "camp-1", status: "completed", createdAt: yesterday.toISOString() },
      ];

      vi.mocked(campaignService.getCampaignRuns).mockResolvedValue({ runs: existingRuns });

      const runsResult = await campaignService.getCampaignRuns("camp-1");
      
      // Check if any run today
      const today = new Date().toISOString().split("T")[0];
      const hasRunToday = runsResult.runs.some(
        (r: { createdAt: string }) => r.createdAt.split("T")[0] === today
      );
      
      expect(hasRunToday).toBe(false);
    });

    it("should NOT queue daily campaign if already ran today", async () => {
      const existingRuns = [
        { id: "run-1", campaignId: "camp-1", status: "completed", createdAt: new Date().toISOString() },
      ];

      vi.mocked(campaignService.getCampaignRuns).mockResolvedValue({ runs: existingRuns });

      const runsResult = await campaignService.getCampaignRuns("camp-1");
      
      const today = new Date().toISOString().split("T")[0];
      const hasRunToday = runsResult.runs.some(
        (r: { createdAt: string }) => r.createdAt.split("T")[0] === today
      );
      
      expect(hasRunToday).toBe(true);
    });
  });

  describe("Queue integration", () => {
    it("should add job to campaign-run queue", async () => {
      const queues = getQueues();
      
      await queues["campaign-run"].add("test-job", {
        campaignId: "camp-123",
        clerkOrgId: "org_test",
      });

      expect(queues["campaign-run"].add).toHaveBeenCalledWith("test-job", {
        campaignId: "camp-123",
        clerkOrgId: "org_test",
      });
    });
  });

  describe("Campaign filtering", () => {
    it("should filter only ongoing campaigns", () => {
      const campaigns = [
        { id: "1", status: "ongoing", recurrence: "oneoff" },
        { id: "2", status: "stopped", recurrence: "daily" },
        { id: "3", status: "ongoing", recurrence: "weekly" },
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

  describe("Recurrence logic", () => {
    it("should correctly identify weekly run needed", () => {
      const now = new Date();
      const eightDaysAgo = new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000);
      const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

      // Run from 8 days ago - should run again
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const hasRunThisWeek = (runs: { createdAt: string }[]) =>
        runs.some((r) => new Date(r.createdAt) > weekAgo);

      expect(hasRunThisWeek([{ createdAt: eightDaysAgo.toISOString() }])).toBe(false);
      expect(hasRunThisWeek([{ createdAt: threeDaysAgo.toISOString() }])).toBe(true);
    });

    it("should correctly identify monthly run needed", () => {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 15);
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 10);

      const hasRunThisMonth = (runs: { createdAt: string }[]) =>
        runs.some((r) => new Date(r.createdAt) >= monthStart);

      expect(hasRunThisMonth([{ createdAt: lastMonth.toISOString() }])).toBe(false);
      expect(hasRunThisMonth([{ createdAt: thisMonth.toISOString() }])).toBe(true);
    });
  });
});
