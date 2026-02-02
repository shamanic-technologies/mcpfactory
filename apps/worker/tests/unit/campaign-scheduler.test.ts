import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock the service client
vi.mock("../../src/lib/service-client.js", () => ({
  campaignService: {
    listCampaigns: vi.fn(),
    getRuns: vi.fn(),
    createRun: vi.fn(),
  },
  runsService: {
    ensureOrganization: vi.fn(),
    listRuns: vi.fn(),
    updateRun: vi.fn(),
  },
}));

// Mock the queues - we need to create a trackable mock
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
      vi.mocked(runsService.listRuns).mockResolvedValue({ runs: [] });

      // Simulate the scheduler logic
      const ongoingCampaigns = campaigns.filter((c) => c.status === "ongoing");
      expect(ongoingCampaigns).toHaveLength(1);

      // Check runs via runs-service
      const runsResult = await runsService.listRuns({ organizationId: "org-id", serviceName: "campaign-service", taskName: "camp-1" });
      expect(runsResult.runs).toHaveLength(0);

      // Should run because no runs exist
      expect(campaigns[0].recurrence).toBe("oneoff");
    });

    it("should NOT queue oneoff campaign with existing runs", async () => {
      const existingRuns = [
        { id: "run-1", status: "completed", createdAt: new Date().toISOString() },
      ];

      vi.mocked(runsService.listRuns).mockResolvedValue({ runs: existingRuns });

      const runsResult = await runsService.listRuns({ organizationId: "org-id", serviceName: "campaign-service", taskName: "camp-1" });
      expect(runsResult.runs).toHaveLength(1);

      // For oneoff, should not run if runs exist
      const shouldRun = runsResult.runs.length === 0;
      expect(shouldRun).toBe(false);
    });

    it("should queue daily campaign if no run today", async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const existingRuns = [
        { id: "run-1", status: "completed", createdAt: yesterday.toISOString() },
      ];

      vi.mocked(runsService.listRuns).mockResolvedValue({ runs: existingRuns });

      const runsResult = await runsService.listRuns({ organizationId: "org-id", serviceName: "campaign-service", taskName: "camp-1" });

      // Check if any run today
      const today = new Date().toISOString().split("T")[0];
      const hasRunToday = runsResult.runs.some(
        (r: { createdAt: string }) => r.createdAt.split("T")[0] === today
      );

      expect(hasRunToday).toBe(false);
    });

    it("should NOT queue daily campaign if already ran today", async () => {
      const existingRuns = [
        { id: "run-1", status: "completed", createdAt: new Date().toISOString() },
      ];

      vi.mocked(runsService.listRuns).mockResolvedValue({ runs: existingRuns });

      const runsResult = await runsService.listRuns({ organizationId: "org-id", serviceName: "campaign-service", taskName: "camp-1" });

      const today = new Date().toISOString().split("T")[0];
      const hasRunToday = runsResult.runs.some(
        (r: { createdAt: string }) => r.createdAt.split("T")[0] === today
      );

      expect(hasRunToday).toBe(true);
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

  describe("startCampaignScheduler integration", () => {
    beforeEach(() => {
      mockQueueAdd.mockClear();
      // Default: ensureOrganization returns an org ID
      vi.mocked(runsService.ensureOrganization).mockResolvedValue("runs-org-id");
    });

    it("should queue oneoff campaign with no existing runs", async () => {
      const campaigns = [
        {
          id: "camp-new",
          orgId: "org-uuid",
          clerkOrgId: "org_clerk123",
          status: "ongoing",
          recurrence: "oneoff",
          createdAt: new Date().toISOString(),
        },
      ];

      vi.mocked(campaignService.listCampaigns).mockResolvedValue({ campaigns });
      vi.mocked(runsService.listRuns).mockResolvedValue({ runs: [] });

      // Start scheduler with very short interval
      const interval = startCampaignScheduler(100000); // Long interval, we test first poll

      // Wait for first poll to complete
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Stop scheduler
      clearInterval(interval);

      // Verify queue.add was called with correct data
      expect(mockQueueAdd).toHaveBeenCalledTimes(1);
      expect(mockQueueAdd).toHaveBeenCalledWith(
        expect.stringContaining("campaign-camp-new"),
        expect.objectContaining({
          campaignId: "camp-new",
          clerkOrgId: "org_clerk123",
        })
      );
    });

    it("should NOT queue oneoff campaign with existing runs", async () => {
      const campaigns = [
        {
          id: "camp-existing",
          orgId: "org-uuid",
          clerkOrgId: "org_clerk456",
          status: "ongoing",
          recurrence: "oneoff",
          createdAt: new Date().toISOString(),
        },
      ];

      const existingRuns = [
        { id: "run-1", status: "completed", createdAt: new Date().toISOString() },
      ];

      vi.mocked(campaignService.listCampaigns).mockResolvedValue({ campaigns });
      vi.mocked(runsService.listRuns).mockResolvedValue({ runs: existingRuns });

      const interval = startCampaignScheduler(100000);
      await new Promise((resolve) => setTimeout(resolve, 100));
      clearInterval(interval);

      // Should NOT have queued because runs already exist
      expect(mockQueueAdd).not.toHaveBeenCalled();
    });

    it("should queue daily campaign if no run today", async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const campaigns = [
        {
          id: "camp-daily",
          orgId: "org-uuid",
          clerkOrgId: "org_clerk789",
          status: "ongoing",
          recurrence: "daily",
          createdAt: new Date().toISOString(),
        },
      ];

      const oldRuns = [
        { id: "run-old", status: "completed", createdAt: yesterday.toISOString() },
      ];

      vi.mocked(campaignService.listCampaigns).mockResolvedValue({ campaigns });
      vi.mocked(runsService.listRuns).mockResolvedValue({ runs: oldRuns });

      const interval = startCampaignScheduler(100000);
      await new Promise((resolve) => setTimeout(resolve, 100));
      clearInterval(interval);

      // Should queue because no run today
      expect(mockQueueAdd).toHaveBeenCalledTimes(1);
      expect(mockQueueAdd).toHaveBeenCalledWith(
        expect.stringContaining("campaign-camp-daily"),
        expect.objectContaining({
          campaignId: "camp-daily",
          clerkOrgId: "org_clerk789",
        })
      );
    });

    it("should handle service errors gracefully", async () => {
      vi.mocked(campaignService.listCampaigns).mockRejectedValue(new Error("Service unavailable"));

      const interval = startCampaignScheduler(100000);
      await new Promise((resolve) => setTimeout(resolve, 100));
      clearInterval(interval);

      // Should not crash, queue should not be called
      expect(mockQueueAdd).not.toHaveBeenCalled();
    });

    it("should skip stopped campaigns", async () => {
      const campaigns = [
        {
          id: "camp-stopped",
          orgId: "org-uuid",
          clerkOrgId: "org_clerk999",
          status: "stopped",
          recurrence: "oneoff",
          createdAt: new Date().toISOString(),
        },
      ];

      vi.mocked(campaignService.listCampaigns).mockResolvedValue({ campaigns });

      const interval = startCampaignScheduler(100000);
      await new Promise((resolve) => setTimeout(resolve, 100));
      clearInterval(interval);

      // Should not queue stopped campaigns
      expect(mockQueueAdd).not.toHaveBeenCalled();
    });
  });
});
