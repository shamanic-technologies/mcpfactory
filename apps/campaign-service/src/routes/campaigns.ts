import { Router } from "express";
import { eq, and } from "drizzle-orm";
import { db } from "../db/index.js";
import { campaigns, campaignRuns, brands } from "../db/schema.js";
import { clerkAuth, requireOrg, AuthenticatedRequest } from "../middleware/auth.js";
import { getOrCreateBrand } from "./brands.js";

const router = Router();

/**
 * GET /campaigns - List all campaigns for org
 * Optional query param: brandId to filter by brand
 */
router.get("/campaigns", clerkAuth, requireOrg, async (req: AuthenticatedRequest, res) => {
  try {
    const { brandId } = req.query;
    
    // Build query with optional brand filter
    let query = db
      .select({
        campaign: campaigns,
        brand: brands,
      })
      .from(campaigns)
      .leftJoin(brands, eq(campaigns.brandId, brands.id))
      .where(eq(campaigns.orgId, req.orgId!))
      .orderBy(campaigns.createdAt);

    const results = await query;

    // Filter by brandId if provided
    const filtered = brandId 
      ? results.filter(r => r.campaign.brandId === brandId)
      : results;

    res.json({ 
      campaigns: filtered.map(r => ({
        ...r.campaign,
        brand: r.brand ? {
          id: r.brand.id,
          domain: r.brand.domain,
          name: r.brand.name,
        } : null,
      }))
    });
  } catch (error) {
    console.error("List campaigns error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /campaigns/:id - Get a specific campaign
 */
router.get("/campaigns/:id", clerkAuth, requireOrg, async (req: AuthenticatedRequest, res) => {
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
 * POST /campaigns - Create a new campaign
 */
router.post("/campaigns", clerkAuth, requireOrg, async (req: AuthenticatedRequest, res) => {
  try {
    const {
      name,
      brandUrl,  // URL of the brand to promote
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

    if (!brandUrl) {
      return res.status(400).json({ error: "brandUrl is required" });
    }

    // Get or create brand from brandUrl
    const brand = await getOrCreateBrand(req.orgId!, brandUrl);
    console.log(`[campaigns] Using brand: ${brand.domain} (id: ${brand.id})`);

    const [campaign] = await db
      .insert(campaigns)
      .values({
        orgId: req.orgId!,
        brandId: brand.id,
        createdByUserId: req.userId!,
        name,
        personTitles,
        qOrganizationKeywordTags,
        organizationLocations,
        organizationNumEmployeesRanges,
        qOrganizationIndustryTagIds,
        qKeywords,
        requestRaw: { ...req.body, brandUrl },  // Store full request for transparency
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
      })
      .returning();

    res.status(201).json({ campaign, brand });
  } catch (error) {
    console.error("Create campaign error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * PATCH /campaigns/:id - Update a campaign
 */
router.patch("/campaigns/:id", clerkAuth, requireOrg, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    // Verify ownership
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
 * POST /campaigns/:id/activate - Activate a campaign
 */
router.post("/campaigns/:id/activate", clerkAuth, requireOrg, async (req: AuthenticatedRequest, res) => {
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
 * POST /campaigns/:id/pause - Pause a campaign
 */
router.post("/campaigns/:id/pause", clerkAuth, requireOrg, async (req: AuthenticatedRequest, res) => {
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
 * DELETE /campaigns/:id - Delete a campaign
 */
router.delete("/campaigns/:id", clerkAuth, requireOrg, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    const result = await db
      .delete(campaigns)
      .where(and(
        eq(campaigns.id, id),
        eq(campaigns.orgId, req.orgId!)
      ))
      .returning();

    if (result.length === 0) {
      return res.status(404).json({ error: "Campaign not found" });
    }

    res.json({ message: "Campaign deleted successfully" });
  } catch (error) {
    console.error("Delete campaign error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
