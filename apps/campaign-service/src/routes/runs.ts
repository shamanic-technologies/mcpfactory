import { Router } from "express";
import { eq, and } from "drizzle-orm";
import { db } from "../db/index.js";
import { campaigns, orgs } from "../db/schema.js";
import { clerkAuth, requireOrg, AuthenticatedRequest } from "../middleware/auth.js";
import { ensureOrganization, listRuns, getRun, createRun, updateRun } from "@mcpfactory/runs-client";

const router = Router();

/**
 * GET /campaigns/:campaignId/runs - List all runs for a campaign
 */
router.get("/campaigns/:campaignId/runs", clerkAuth, requireOrg, async (req: AuthenticatedRequest, res) => {
  try {
    const { campaignId } = req.params;

    // Verify campaign ownership
    const campaign = await db.query.campaigns.findFirst({
      where: and(
        eq(campaigns.id, campaignId),
        eq(campaigns.orgId, req.orgId!)
      ),
    });

    if (!campaign) {
      return res.status(404).json({ error: "Campaign not found" });
    }

    // Fetch runs from runs-service
    const runsOrgId = await ensureOrganization(req.clerkOrgId!);
    const result = await listRuns({
      organizationId: runsOrgId,
      serviceName: "campaign-service",
      taskName: campaignId,
    });

    res.json({ runs: result.runs });
  } catch (error) {
    console.error("List runs error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /campaigns/:campaignId/runs/:runId - Get a specific run
 */
router.get("/campaigns/:campaignId/runs/:runId", clerkAuth, requireOrg, async (req: AuthenticatedRequest, res) => {
  try {
    const { campaignId, runId } = req.params;

    // Verify campaign ownership
    const campaign = await db.query.campaigns.findFirst({
      where: and(
        eq(campaigns.id, campaignId),
        eq(campaigns.orgId, req.orgId!)
      ),
    });

    if (!campaign) {
      return res.status(404).json({ error: "Campaign not found" });
    }

    const run = await getRun(runId);

    res.json({ run });
  } catch (error) {
    console.error("Get run error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /campaigns/:campaignId/runs - Trigger a new run (internal/service use)
 */
router.post("/campaigns/:campaignId/runs", async (req, res) => {
  try {
    const { campaignId } = req.params;

    const campaign = await db.query.campaigns.findFirst({
      where: eq(campaigns.id, campaignId),
    });

    if (!campaign) {
      return res.status(404).json({ error: "Campaign not found" });
    }

    // Look up clerkOrgId from the org
    const org = await db.query.orgs.findFirst({
      where: eq(orgs.id, campaign.orgId),
    });

    if (!org) {
      return res.status(500).json({ error: "Organization not found" });
    }

    const runsOrgId = await ensureOrganization(org.clerkOrgId);
    const run = await createRun({
      organizationId: runsOrgId,
      serviceName: "campaign-service",
      taskName: campaignId,
    });

    res.status(201).json({ run });
  } catch (error) {
    console.error("Create run error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * PATCH /runs/:runId - Update run status (internal/service use)
 */
router.patch("/runs/:runId", async (req, res) => {
  try {
    const { runId } = req.params;
    const { status } = req.body;

    if (status !== "completed" && status !== "failed") {
      return res.status(400).json({ error: "Status must be 'completed' or 'failed'" });
    }

    const run = await updateRun(runId, status);

    res.json({ run });
  } catch (error) {
    console.error("Update run error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
