import { describe, it, expect, beforeEach, afterAll, vi } from "vitest";
import request from "supertest";

// vi.hoisted ensures these are available when vi.mock factory runs (hoisted to top)
const {
  mockEnsureOrganization,
  mockListRuns,
  mockCreateRun,
  mockUpdateRun,
  mockGetRun,
} = vi.hoisted(() => ({
  mockEnsureOrganization: vi.fn(),
  mockListRuns: vi.fn(),
  mockCreateRun: vi.fn(),
  mockUpdateRun: vi.fn(),
  mockGetRun: vi.fn(),
}));

vi.mock("@mcpfactory/runs-client", () => ({
  ensureOrganization: mockEnsureOrganization,
  listRuns: mockListRuns,
  getRun: mockGetRun,
  createRun: mockCreateRun,
  updateRun: mockUpdateRun,
}));

import app from "../../src/index.js";
import { cleanTestData, closeDb, insertTestOrg, insertTestCampaign } from "../helpers/test-db.js";

describe("Scheduler Endpoints", () => {
  beforeEach(async () => {
    await cleanTestData();
    vi.clearAllMocks();
    // Reset default mock values
    mockEnsureOrganization.mockResolvedValue("runs-org-uuid");
    mockListRuns.mockResolvedValue({ runs: [] });
  });

  afterAll(async () => {
    await cleanTestData();
    await closeDb();
  });

  describe("GET /internal/campaigns/all", () => {
    it("should return all campaigns across all orgs", async () => {
      const org1 = await insertTestOrg({ clerkOrgId: "org_1" });
      const org2 = await insertTestOrg({ clerkOrgId: "org_2" });

      await insertTestCampaign(org1.id, { name: "Org1 Campaign", status: "ongoing" });
      await insertTestCampaign(org2.id, { name: "Org2 Campaign", status: "ongoing" });

      const res = await request(app)
        .get("/internal/campaigns/all")
        .expect(200);

      expect(res.body.campaigns).toHaveLength(2);
      expect(res.body.campaigns[0].clerkOrgId).toBeDefined();
    });

    it("should include clerkOrgId for downstream service calls", async () => {
      const org = await insertTestOrg({ clerkOrgId: "org_test_clerk" });
      await insertTestCampaign(org.id, { name: "Test", status: "ongoing" });

      const res = await request(app)
        .get("/internal/campaigns/all")
        .expect(200);

      expect(res.body.campaigns[0].clerkOrgId).toBe("org_test_clerk");
    });

    it("should return empty array when no campaigns", async () => {
      const res = await request(app)
        .get("/internal/campaigns/all")
        .expect(200);

      expect(res.body.campaigns).toHaveLength(0);
    });
  });

  describe("GET /internal/campaigns/:id/runs/all", () => {
    it("should return runs from runs-service for a campaign", async () => {
      const org = await insertTestOrg({ clerkOrgId: "org_runs_test" });
      const campaign = await insertTestCampaign(org.id);

      mockListRuns.mockResolvedValue({
        runs: [
          { id: "run-1", status: "completed", createdAt: new Date().toISOString() },
          { id: "run-2", status: "running", createdAt: new Date().toISOString() },
        ],
      });

      const res = await request(app)
        .get(`/internal/campaigns/${campaign.id}/runs/all`)
        .expect(200);

      expect(res.body.runs).toHaveLength(2);
      expect(mockEnsureOrganization).toHaveBeenCalledWith("org_runs_test");
    });

    it("should return empty array for campaign with no runs", async () => {
      const org = await insertTestOrg();
      const campaign = await insertTestCampaign(org.id);

      const res = await request(app)
        .get(`/internal/campaigns/${campaign.id}/runs/all`)
        .expect(200);

      expect(res.body.runs).toHaveLength(0);
    });
  });

  describe("POST /internal/campaigns/:id/runs", () => {
    it("should create a new campaign run via runs-service", async () => {
      const org = await insertTestOrg({ clerkOrgId: "org_create_run" });
      const campaign = await insertTestCampaign(org.id, { status: "ongoing" });

      mockCreateRun.mockResolvedValue({
        id: "new-run-id",
        status: "running",
        serviceName: "campaign-service",
        taskName: campaign.id,
        createdAt: new Date().toISOString(),
      });

      const res = await request(app)
        .post(`/internal/campaigns/${campaign.id}/runs`)
        .expect(200);

      expect(res.body.run).toBeDefined();
      expect(res.body.run.status).toBe("running");
      expect(mockCreateRun).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: "runs-org-uuid",
          serviceName: "campaign-service",
          taskName: campaign.id,
        })
      );
    });

    it("should return 404 for non-existent campaign", async () => {
      const res = await request(app)
        .post("/internal/campaigns/00000000-0000-0000-0000-000000000000/runs")
        .expect(404);

      expect(res.body.error).toContain("not found");
    });
  });

  describe("PATCH /internal/runs/:id", () => {
    it("should update run status to completed", async () => {
      mockUpdateRun.mockResolvedValue({
        id: "run-1",
        status: "completed",
        completedAt: new Date().toISOString(),
      });

      const res = await request(app)
        .patch("/internal/runs/run-1")
        .send({ status: "completed" })
        .expect(200);

      expect(res.body.run.status).toBe("completed");
      expect(mockUpdateRun).toHaveBeenCalledWith("run-1", "completed");
    });

    it("should update run status to failed", async () => {
      mockUpdateRun.mockResolvedValue({
        id: "run-2",
        status: "failed",
      });

      const res = await request(app)
        .patch("/internal/runs/run-2")
        .send({ status: "failed" })
        .expect(200);

      expect(res.body.run.status).toBe("failed");
    });

    it("should return 400 for invalid status", async () => {
      const res = await request(app)
        .patch("/internal/runs/run-1")
        .send({ status: "invalid" })
        .expect(400);

      expect(res.body.error).toContain("Status must be");
    });

    it("should return 500 when runs-service fails", async () => {
      mockUpdateRun.mockRejectedValueOnce(new Error("Run not found"));

      const res = await request(app)
        .patch("/internal/runs/00000000-0000-0000-0000-000000000000")
        .send({ status: "completed" })
        .expect(500);

      expect(res.body.error).toBe("Internal server error");
    });
  });

  describe("Scheduler workflow simulation", () => {
    it("should simulate full scheduler flow: list -> check runs -> create run -> update", async () => {
      const org = await insertTestOrg({ clerkOrgId: "org_workflow_test" });
      const campaign = await insertTestCampaign(org.id, {
        name: "Workflow Test",
        status: "ongoing",
      });

      // 1. Scheduler lists all campaigns
      const listRes = await request(app)
        .get("/internal/campaigns/all")
        .expect(200);

      expect(listRes.body.campaigns).toHaveLength(1);
      expect(listRes.body.campaigns[0].status).toBe("ongoing");

      // 2. Scheduler checks runs for this campaign (returns empty)
      const runsRes = await request(app)
        .get(`/internal/campaigns/${campaign.id}/runs/all`)
        .expect(200);

      expect(runsRes.body.runs).toHaveLength(0);

      // 3. Scheduler creates a run
      const newRun = {
        id: "workflow-run-1",
        status: "running",
        serviceName: "campaign-service",
        taskName: campaign.id,
        createdAt: new Date().toISOString(),
      };
      mockCreateRun.mockResolvedValue(newRun);

      const createRes = await request(app)
        .post(`/internal/campaigns/${campaign.id}/runs`)
        .expect(200);

      expect(createRes.body.run.status).toBe("running");
      const runId = createRes.body.run.id;

      // 4. Worker completes the run
      mockUpdateRun.mockResolvedValue({
        ...newRun,
        status: "completed",
        completedAt: new Date().toISOString(),
      });

      const updateRes = await request(app)
        .patch(`/internal/runs/${runId}`)
        .send({ status: "completed" })
        .expect(200);

      expect(updateRes.body.run.status).toBe("completed");

      // 5. Scheduler checks again - should see 1 run
      mockListRuns.mockResolvedValue({ runs: [{ ...newRun, status: "completed" }] });

      const runsRes2 = await request(app)
        .get(`/internal/campaigns/${campaign.id}/runs/all`)
        .expect(200);

      expect(runsRes2.body.runs).toHaveLength(1);
    });
  });
});
