/**
 * Internal routes for service-to-service calls
 * Uses serviceAuth (x-clerk-org-id header) instead of clerkAuth (JWT)
 */

import { Router } from "express";
import { eq, and } from "drizzle-orm";
import { db } from "../db/index.js";
import { campaigns, campaignRuns } from "../db/schema.js";
import { serviceAuth, AuthenticatedRequest } from "../middleware/auth.js";

const router = Router();

/**
 * GET /internal/campaigns - List all campaigns for org
 */
router.get("/campaigns", serviceAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const orgCampaigns = await db.query.campaigns.findMany({
      where: eq(campaigns.orgId, req.orgId!),
      orderBy: (campaigns, { desc }) => [desc(campaigns.createdAt)],
    });

    res.json({ campaigns: orgCampaigns });
  } catch (error) {
    console.error("List campaigns error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /internal/campaigns/:id - Get a specific campaign
 */
router.get("/campaigns/:id", serviceAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    const campaign = await db.query.campaigns.findFirst({
      where: and(
        eq(campaigns.id, id),
        eq(campaigns.orgId, req.orgId!)
      ),
    });

    if (!campaign) {
      return res.status(404).json({ error: "Campaign not found" });
    }

    res.json({ campaign });
  } catch (error) {
    console.error("Get campaign error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /internal/campaigns - Create a new campaign
 * createdByUserId is optional - MCP API key auth may not have user context
 */
router.post("/campaigns", serviceAuth, async (req: AuthenticatedRequest, res) => {
  try {
    console.log("POST /internal/campaigns - orgId:", req.orgId, "userId:", req.userId, "body:", JSON.stringify(req.body));
    
    const {
      name,
      personTitles,
      qOrganizationKeywordTags,
      organizationLocations,
      organizationNumEmployeesRanges,
      qOrganizationIndustryTagIds,
      qKeywords,
      maxBudgetDailyUsd,
      maxBudgetWeeklyUsd,
      maxBudgetMonthlyUsd,
      startDate,
      endDate,
      recurrence,
      notifyFrequency,
      notifyChannel,
      notifyDestination,
    } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Campaign name is required" });
    }

    const insertData = {
      orgId: req.orgId!,
      createdByUserId: req.userId || null, // From x-clerk-user-id header
      name,
      personTitles,
      qOrganizationKeywordTags,
      organizationLocations,
      organizationNumEmployeesRanges,
      qOrganizationIndustryTagIds,
      qKeywords,
      requestRaw: req.body,
      maxBudgetDailyUsd,
      maxBudgetWeeklyUsd,
      maxBudgetMonthlyUsd,
      startDate,
      endDate,
      recurrence,
      notifyFrequency,
      notifyChannel,
      notifyDestination,
      status: "draft",
    };
    
    console.log("Insert data:", JSON.stringify(insertData));

    const [campaign] = await db
      .insert(campaigns)
      .values(insertData)
      .returning();

    res.status(201).json({ campaign });
  } catch (error: any) {
    console.error("Create campaign error:", error.message, error.stack);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

/**
 * PATCH /internal/campaigns/:id - Update a campaign
 */
router.patch("/campaigns/:id", serviceAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    const existing = await db.query.campaigns.findFirst({
      where: and(
        eq(campaigns.id, id),
        eq(campaigns.orgId, req.orgId!)
      ),
    });

    if (!existing) {
      return res.status(404).json({ error: "Campaign not found" });
    }

    const [updated] = await db
      .update(campaigns)
      .set({
        ...req.body,
        updatedAt: new Date(),
      })
      .where(eq(campaigns.id, id))
      .returning();

    res.json({ campaign: updated });
  } catch (error) {
    console.error("Update campaign error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /internal/campaigns/:id/activate - Activate a campaign
 */
router.post("/campaigns/:id/activate", serviceAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    const [updated] = await db
      .update(campaigns)
      .set({
        status: "active",
        updatedAt: new Date(),
      })
      .where(and(
        eq(campaigns.id, id),
        eq(campaigns.orgId, req.orgId!)
      ))
      .returning();

    if (!updated) {
      return res.status(404).json({ error: "Campaign not found" });
    }

    res.json({ campaign: updated });
  } catch (error) {
    console.error("Activate campaign error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /internal/campaigns/:id/pause - Pause a campaign
 */
router.post("/campaigns/:id/pause", serviceAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    const [updated] = await db
      .update(campaigns)
      .set({
        status: "paused",
        updatedAt: new Date(),
      })
      .where(and(
        eq(campaigns.id, id),
        eq(campaigns.orgId, req.orgId!)
      ))
      .returning();

    if (!updated) {
      return res.status(404).json({ error: "Campaign not found" });
    }

    res.json({ campaign: updated });
  } catch (error) {
    console.error("Pause campaign error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /internal/campaigns/:id/runs - Get campaign runs
 */
router.get("/campaigns/:id/runs", serviceAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    // Verify campaign ownership
    const campaign = await db.query.campaigns.findFirst({
      where: and(
        eq(campaigns.id, id),
        eq(campaigns.orgId, req.orgId!)
      ),
    });

    if (!campaign) {
      return res.status(404).json({ error: "Campaign not found" });
    }

    const runs = await db.query.campaignRuns.findMany({
      where: eq(campaignRuns.campaignId, id),
      orderBy: (runs, { desc }) => [desc(runs.createdAt)],
    });

    res.json({ runs });
  } catch (error) {
    console.error("Get campaign runs error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /internal/campaigns/:id/stats - Get campaign statistics
 */
router.get("/campaigns/:id/stats", serviceAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    // Verify campaign ownership
    const campaign = await db.query.campaigns.findFirst({
      where: and(
        eq(campaigns.id, id),
        eq(campaigns.orgId, req.orgId!)
      ),
    });

    if (!campaign) {
      return res.status(404).json({ error: "Campaign not found" });
    }

    // Get all runs for stats
    const runs = await db.query.campaignRuns.findMany({
      where: eq(campaignRuns.campaignId, id),
    });

    // Calculate aggregate stats (detailed stats come from other services)
    const stats = {
      totalRuns: runs.length,
      completedRuns: runs.filter(r => r.status === "completed").length,
      failedRuns: runs.filter(r => r.status === "failed").length,
      runningRuns: runs.filter(r => r.status === "running").length,
    };

    res.json({ stats, campaign });
  } catch (error) {
    console.error("Get campaign stats error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
