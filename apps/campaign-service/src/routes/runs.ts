import { Router } from "express";
import { eq, and } from "drizzle-orm";
import { db } from "../db/index.js";
import { campaigns, campaignRuns } from "../db/schema.js";
import { clerkAuth, requireOrg, AuthenticatedRequest } from "../middleware/auth.js";

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

    const runs = await db.query.campaignRuns.findMany({
      where: eq(campaignRuns.campaignId, campaignId),
      orderBy: (campaignRuns, { desc }) => [desc(campaignRuns.runStartedAt)],
    });

    res.json({ runs });
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

    const run = await db.query.campaignRuns.findFirst({
      where: and(
        eq(campaignRuns.id, runId),
        eq(campaignRuns.campaignId, campaignId)
      ),
    });

    if (!run) {
      return res.status(404).json({ error: "Run not found" });
    }

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

    // No auth needed - Railway private network

    const campaign = await db.query.campaigns.findFirst({
      where: eq(campaigns.id, campaignId),
    });

    if (!campaign) {
      return res.status(404).json({ error: "Campaign not found" });
    }

    const [run] = await db
      .insert(campaignRuns)
      .values({
        campaignId: campaign.id,
        orgId: campaign.orgId,
        runStartedAt: new Date(),
        status: "running",
      })
      .returning();

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

    // No auth needed - Railway private network

    const { status, errorMessage } = req.body;

    const updateData: Record<string, unknown> = {};
    if (status) updateData.status = status;
    if (errorMessage) updateData.errorMessage = errorMessage;
    if (status === "completed" || status === "failed" || status === "stopped") {
      updateData.runEndedAt = new Date();
    }

    const [updated] = await db
      .update(campaignRuns)
      .set(updateData)
      .where(eq(campaignRuns.id, runId))
      .returning();

    if (!updated) {
      return res.status(404).json({ error: "Run not found" });
    }

    res.json({ run: updated });
  } catch (error) {
    console.error("Update run error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
