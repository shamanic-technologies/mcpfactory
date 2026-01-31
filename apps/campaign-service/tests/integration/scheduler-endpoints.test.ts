import { describe, it, expect, beforeEach, afterAll } from "vitest";
import request from "supertest";
import app from "../../src/index.js";
import { cleanTestData, closeDb, insertTestOrg, insertTestCampaign, insertTestCampaignRun } from "../helpers/test-db.js";

describe("Scheduler Endpoints", () => {
  beforeEach(async () => {
    await cleanTestData();
  });

  afterAll(async () => {
    await cleanTestData();
    await closeDb();
  });

  describe("GET /internal/campaigns/all", () => {
    it("should return all campaigns across all orgs", async () => {
      // Create two orgs with campaigns
      const org1 = await insertTestOrg({ clerkOrgId: "org_1" });
      const org2 = await insertTestOrg({ clerkOrgId: "org_2" });
      
      await insertTestCampaign(org1.id, { name: "Org1 Campaign", status: "ongoing" });
      await insertTestCampaign(org2.id, { name: "Org2 Campaign", status: "ongoing" });

      const res = await request(app)
        .get("/internal/campaigns/all")
        .expect(200);

      expect(res.body.campaigns).toHaveLength(2);
      // Should include clerkOrgId from joined orgs
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
    it("should return all runs for a campaign without auth", async () => {
      const org = await insertTestOrg();
      const campaign = await insertTestCampaign(org.id);
      await insertTestCampaignRun(campaign.id, org.id, { status: "completed" });
      await insertTestCampaignRun(campaign.id, org.id, { status: "running" });

      const res = await request(app)
        .get(`/internal/campaigns/${campaign.id}/runs/all`)
        .expect(200);

      expect(res.body.runs).toHaveLength(2);
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
    it("should create a new campaign run", async () => {
      const org = await insertTestOrg();
      const campaign = await insertTestCampaign(org.id, { status: "ongoing" });

      const res = await request(app)
        .post(`/internal/campaigns/${campaign.id}/runs`)
        .expect(200);

      expect(res.body.run).toBeDefined();
      expect(res.body.run.campaignId).toBe(campaign.id);
      expect(res.body.run.status).toBe("running");
    });

    it("should return 404 for non-existent campaign", async () => {
      const res = await request(app)
        .post("/internal/campaigns/00000000-0000-0000-0000-000000000000/runs")
        .expect(404);

      expect(res.body.error).toBe("Campaign not found");
    });
  });

  describe("PATCH /internal/runs/:id", () => {
    it("should update run status to completed", async () => {
      const org = await insertTestOrg();
      const campaign = await insertTestCampaign(org.id);
      const run = await insertTestCampaignRun(campaign.id, org.id, { status: "running" });

      const res = await request(app)
        .patch(`/internal/runs/${run.id}`)
        .send({ status: "completed" })
        .expect(200);

      expect(res.body.run.status).toBe("completed");
      expect(res.body.run.completedAt).toBeDefined();
    });

    it("should update run status to failed with error message", async () => {
      const org = await insertTestOrg();
      const campaign = await insertTestCampaign(org.id);
      const run = await insertTestCampaignRun(campaign.id, org.id, { status: "running" });

      const res = await request(app)
        .patch(`/internal/runs/${run.id}`)
        .send({ status: "failed", errorMessage: "API rate limited" })
        .expect(200);

      expect(res.body.run.status).toBe("failed");
      expect(res.body.run.errorMessage).toBe("API rate limited");
    });

    it("should return 404 for non-existent run", async () => {
      const res = await request(app)
        .patch("/internal/runs/00000000-0000-0000-0000-000000000000")
        .send({ status: "completed" })
        .expect(404);

      expect(res.body.error).toBe("Run not found");
    });
  });

  describe("Scheduler workflow simulation", () => {
    it("should simulate full scheduler flow: list -> check runs -> create run", async () => {
      const org = await insertTestOrg({ clerkOrgId: "org_workflow_test" });
      const campaign = await insertTestCampaign(org.id, { 
        name: "Workflow Test",
        status: "ongoing",
        recurrence: "oneoff",
      });

      // 1. Scheduler lists all campaigns
      const listRes = await request(app)
        .get("/internal/campaigns/all")
        .expect(200);
      
      expect(listRes.body.campaigns).toHaveLength(1);
      expect(listRes.body.campaigns[0].status).toBe("ongoing");
      expect(listRes.body.campaigns[0].recurrence).toBe("oneoff");

      // 2. Scheduler checks runs for this campaign
      const runsRes = await request(app)
        .get(`/internal/campaigns/${campaign.id}/runs/all`)
        .expect(200);
      
      expect(runsRes.body.runs).toHaveLength(0); // No runs yet

      // 3. Scheduler creates a run (since no runs exist for oneoff)
      const createRes = await request(app)
        .post(`/internal/campaigns/${campaign.id}/runs`)
        .expect(200);
      
      expect(createRes.body.run.status).toBe("running");
      const runId = createRes.body.run.id;

      // 4. Worker completes the run
      const updateRes = await request(app)
        .patch(`/internal/runs/${runId}`)
        .send({ status: "completed" })
        .expect(200);
      
      expect(updateRes.body.run.status).toBe("completed");

      // 5. Scheduler checks again - should NOT create another run for oneoff
      const runsRes2 = await request(app)
        .get(`/internal/campaigns/${campaign.id}/runs/all`)
        .expect(200);
      
      expect(runsRes2.body.runs).toHaveLength(1);
    });
  });
});
