/**
 * Internal routes for service-to-service calls
 * Uses serviceAuth (x-clerk-org-id header) instead of clerkAuth (JWT)
 */

import { Router } from "express";
import { eq, and } from "drizzle-orm";
import { db } from "../db/index.js";
import { campaigns, campaignRuns, orgs } from "../db/schema.js";
import { serviceAuth, AuthenticatedRequest } from "../middleware/auth.js";
import { getAggregatedStats, getLeadsForCampaignRuns, aggregateCompaniesFromLeads } from "../lib/service-client.js";
import { extractDomain } from "../lib/domain.js";

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
 * GET /internal/campaigns/all - List all campaigns across all orgs (for scheduler)
 * No serviceAuth - uses internal network trust
 * Returns campaigns with clerkOrgId and brandUrl for downstream service calls
 */
router.get("/campaigns/all", async (_req, res) => {
  try {
    // Join with orgs to get clerkOrgId
    // brandUrl is now stored directly on campaigns, no need to join brands table
    const allCampaigns = await db
      .select({
        id: campaigns.id,
        orgId: campaigns.orgId,
        name: campaigns.name,
        status: campaigns.status,
        recurrence: campaigns.recurrence,
        personTitles: campaigns.personTitles,
        organizationLocations: campaigns.organizationLocations,
        qOrganizationKeywordTags: campaigns.qOrganizationKeywordTags,
        organizationNumEmployeesRanges: campaigns.organizationNumEmployeesRanges,
        qOrganizationIndustryTagIds: campaigns.qOrganizationIndustryTagIds,
        qKeywords: campaigns.qKeywords,
        maxBudgetDailyUsd: campaigns.maxBudgetDailyUsd,
        maxBudgetWeeklyUsd: campaigns.maxBudgetWeeklyUsd,
        maxBudgetMonthlyUsd: campaigns.maxBudgetMonthlyUsd,
        requestRaw: campaigns.requestRaw,
        createdAt: campaigns.createdAt,
        clerkOrgId: orgs.clerkOrgId,
        brandUrl: campaigns.brandUrl,
      })
      .from(campaigns)
      .innerJoin(orgs, eq(campaigns.orgId, orgs.id))
      .orderBy(campaigns.createdAt);

    // Add brandDomain derived from brandUrl for compatibility
    const enrichedCampaigns = allCampaigns.map(c => ({
      ...c,
      brandDomain: c.brandUrl ? extractDomain(c.brandUrl) : null,
      brandName: c.brandUrl ? extractDomain(c.brandUrl) : null,  // Use domain as name fallback
    }));

    res.json({ campaigns: enrichedCampaigns });
  } catch (error) {
    console.error("List all campaigns error:", error);
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
 * 
 * Brand is NOT created here. The worker will call brand-service to upsert the brand.
 * We only store the brandUrl in the campaign.
 */
router.post("/campaigns", serviceAuth, async (req: AuthenticatedRequest, res) => {
  try {
    console.log("POST /internal/campaigns - orgId:", req.orgId, "userId:", req.userId, "body:", JSON.stringify(req.body));
    
    const {
      name,
      brandUrl,
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

    // Validate recurrence
    const validRecurrences = ["oneoff", "daily", "weekly", "monthly"];
    if (!recurrence || !validRecurrences.includes(recurrence)) {
      return res.status(400).json({ 
        error: `recurrence is required. Valid values: ${validRecurrences.join(", ")}` 
      });
    }

    // Validate at least one budget is set
    if (!maxBudgetDailyUsd && !maxBudgetWeeklyUsd && !maxBudgetMonthlyUsd) {
      return res.status(400).json({ 
        error: "At least one budget must be set (maxBudgetDailyUsd, maxBudgetWeeklyUsd, or maxBudgetMonthlyUsd)" 
      });
    }

    // Store brandUrl directly - brand-service will be called by worker to upsert brand
    const brandDomain = extractDomain(brandUrl);
    console.log(`[internal/campaigns] Using brandUrl: ${brandUrl} (domain: ${brandDomain})`);

    const insertData = {
      orgId: req.orgId!,
      brandUrl,  // Store URL directly, no brandId needed
      createdByUserId: req.userId || null,
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
      status: "ongoing",
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
 * POST /internal/campaigns/:id/stop - Stop a campaign
 */
router.post("/campaigns/:id/stop", serviceAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    const [updated] = await db
      .update(campaigns)
      .set({
        status: "stopped",
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
    console.error("Stop campaign error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /internal/campaigns/:id/resume - Resume a stopped campaign
 */
router.post("/campaigns/:id/resume", serviceAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    const [updated] = await db
      .update(campaigns)
      .set({
        status: "ongoing",
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
    console.error("Resume campaign error:", error);
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
 * GET /internal/campaigns/:id/runs/all - Get campaign runs (no auth, for scheduler)
 */
router.get("/campaigns/:id/runs/all", async (req, res) => {
  try {
    const { id } = req.params;

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
 * POST /internal/campaigns/:id/runs - Create a new campaign run (for scheduler)
 */
router.post("/campaigns/:id/runs", async (req, res) => {
  try {
    const { id } = req.params;

    // Verify campaign exists
    const campaign = await db.query.campaigns.findFirst({
      where: eq(campaigns.id, id),
    });

    if (!campaign) {
      return res.status(404).json({ error: "Campaign not found" });
    }

    // Create a new run
    const [run] = await db
      .insert(campaignRuns)
      .values({
        campaignId: id,
        orgId: campaign.orgId,
        status: "running",
        runStartedAt: new Date(),
      })
      .returning();

    console.log(`Created campaign run ${run.id} for campaign ${id}`);
    res.json({ run });
  } catch (error) {
    console.error("Create campaign run error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * PATCH /internal/runs/:id - Update a campaign run
 */
router.patch("/runs/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status, errorMessage } = req.body;

    const [updated] = await db
      .update(campaignRuns)
      .set({
        status,
        errorMessage,
        ...(status === "completed" || status === "failed" ? { runEndedAt: new Date() } : {}),
      })
      .where(eq(campaignRuns.id, id))
      .returning();

    if (!updated) {
      return res.status(404).json({ error: "Run not found" });
    }

    res.json({ run: updated });
  } catch (error) {
    console.error("Update campaign run error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /internal/campaigns/:id/debug - Get detailed debug info for a campaign
 * Shows campaign details, all runs with status/errors, and pipeline state
 */
router.get("/campaigns/:id/debug", serviceAuth, async (req: AuthenticatedRequest, res) => {
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

    // Get all runs for this campaign with full details
    const runs = await db.query.campaignRuns.findMany({
      where: eq(campaignRuns.campaignId, id),
      orderBy: (runs, { desc }) => [desc(runs.createdAt)],
    });

    // Build debug response
    const debug = {
      campaign: {
        id: campaign.id,
        name: campaign.name,
        status: campaign.status,
        recurrence: campaign.recurrence,
        createdAt: campaign.createdAt,
        updatedAt: campaign.updatedAt,
        targeting: {
          personTitles: campaign.personTitles,
          locations: campaign.organizationLocations,
          industries: campaign.qOrganizationKeywordTags,
        },
        budget: {
          daily: campaign.maxBudgetDailyUsd,
          weekly: campaign.maxBudgetWeeklyUsd,
          monthly: campaign.maxBudgetMonthlyUsd,
        },
      },
      runs: runs.map(run => ({
        id: run.id,
        status: run.status,
        startedAt: run.runStartedAt,
        endedAt: run.runEndedAt,
        createdAt: run.createdAt,
        errorMessage: run.errorMessage,
        durationMs: run.runStartedAt && run.runEndedAt 
          ? new Date(run.runEndedAt).getTime() - new Date(run.runStartedAt).getTime()
          : null,
      })),
      summary: {
        totalRuns: runs.length,
        completed: runs.filter(r => r.status === "completed").length,
        failed: runs.filter(r => r.status === "failed").length,
        running: runs.filter(r => r.status === "running").length,
        pending: runs.filter(r => r.status === "pending").length,
        lastRunAt: runs[0]?.createdAt || null,
        errors: runs.filter(r => r.errorMessage).map(r => ({
          runId: r.id,
          error: r.errorMessage,
          at: r.runEndedAt || r.createdAt,
        })),
      },
    };

    res.json(debug);
  } catch (error) {
    console.error("Get campaign debug error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /internal/campaigns/:id/stats - Get campaign statistics
 * Aggregates stats from all services (apollo, emailgen, postmark)
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

    // Get all runs for this campaign
    const runs = await db.query.campaignRuns.findMany({
      where: eq(campaignRuns.campaignId, id),
    });

    const campaignRunIds = runs.map(r => r.id);

    // Aggregate stats from other services
    const aggregated = await getAggregatedStats(campaignRunIds, req.clerkOrgId!);

    // Build response with run stats + aggregated stats
    const stats = {
      campaignId: id,
      totalRuns: runs.length,
      completedRuns: runs.filter(r => r.status === "completed").length,
      failedRuns: runs.filter(r => r.status === "failed").length,
      runningRuns: runs.filter(r => r.status === "running").length,
      // Aggregated from other services
      leadsFound: aggregated.leadsFound,
      emailsGenerated: aggregated.emailsGenerated,
      emailsSent: aggregated.emailsSent,
      emailsOpened: aggregated.emailsOpened,
      emailsClicked: aggregated.emailsClicked,
      emailsReplied: aggregated.emailsReplied,
      emailsBounced: aggregated.emailsBounced,
      // Reply classifications
      repliesWillingToMeet: aggregated.repliesWillingToMeet,
      repliesInterested: aggregated.repliesInterested,
      repliesNotInterested: aggregated.repliesNotInterested,
      repliesOutOfOffice: aggregated.repliesOutOfOffice,
      repliesUnsubscribe: aggregated.repliesUnsubscribe,
    };

    res.json(stats);
  } catch (error) {
    console.error("Get campaign stats error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /internal/campaigns/:id/leads - Get all leads for a campaign
 * Aggregates leads from apollo-service across all campaign runs
 */
router.get("/campaigns/:id/leads", serviceAuth, async (req: AuthenticatedRequest, res) => {
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

    // Get all runs for this campaign
    const runs = await db.query.campaignRuns.findMany({
      where: eq(campaignRuns.campaignId, id),
    });

    const campaignRunIds = runs.map(r => r.id);

    // Fetch leads from apollo-service
    const leads = await getLeadsForCampaignRuns(campaignRunIds, req.clerkOrgId!);

    // Map to expected format
    const mappedLeads = leads.map(lead => ({
      id: lead.id,
      firstName: lead.firstName,
      lastName: lead.lastName,
      email: lead.email,
      title: lead.title,
      organizationName: lead.organizationName,
      linkedinUrl: lead.linkedinUrl,
      status: "found", // Default status since we don't track this yet
      createdAt: lead.createdAt,
    }));

    res.json({ leads: mappedLeads });
  } catch (error) {
    console.error("Get campaign leads error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /internal/campaigns/:id/companies - Get all companies for a campaign
 * Aggregates companies from leads across all campaign runs
 */
router.get("/campaigns/:id/companies", serviceAuth, async (req: AuthenticatedRequest, res) => {
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

    // Get all runs for this campaign
    const runs = await db.query.campaignRuns.findMany({
      where: eq(campaignRuns.campaignId, id),
    });

    const campaignRunIds = runs.map(r => r.id);

    // Fetch leads from apollo-service
    const leads = await getLeadsForCampaignRuns(campaignRunIds, req.clerkOrgId!);

    // Aggregate into companies
    const companies = aggregateCompaniesFromLeads(leads);

    res.json({ companies });
  } catch (error) {
    console.error("Get campaign companies error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
