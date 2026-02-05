/**
 * Internal routes for service-to-service calls
 * Uses serviceAuth (x-clerk-org-id header) instead of clerkAuth (JWT)
 */

import { Router } from "express";
import { eq, and } from "drizzle-orm";
import { db } from "../db/index.js";
import { campaigns, orgs } from "../db/schema.js";
import { serviceAuth, AuthenticatedRequest } from "../middleware/auth.js";
import { getAggregatedStats, getStatsByModel, getLeadsForRuns, aggregateCompaniesFromLeads, type AggregatedStats } from "../lib/service-client.js";
import { extractDomain } from "../lib/domain.js";
import { ensureOrganization, listRuns, getRun, getRunsBatch, createRun, updateRun, type Run, type RunWithCosts } from "@mcpfactory/runs-client";

const router = Router();

/**
 * Helper: get clerkOrgId from a campaign's org (for no-auth routes)
 */
async function getClerkOrgIdFromCampaign(campaignId: string): Promise<string | null> {
  const campaign = await db.query.campaigns.findFirst({
    where: eq(campaigns.id, campaignId),
    columns: { orgId: true },
  });
  if (!campaign) return null;

  const org = await db.query.orgs.findFirst({
    where: eq(orgs.id, campaign.orgId),
    columns: { clerkOrgId: true },
  });
  return org?.clerkOrgId || null;
}

/**
 * Helper: get run IDs from runs-service for a given campaign
 */
async function getRunIds(clerkOrgId: string, campaignId: string): Promise<string[]> {
  const runsOrgId = await ensureOrganization(clerkOrgId);
  const result = await listRuns({
    organizationId: runsOrgId,
    serviceName: "campaign-service",
    taskName: campaignId,
  });
  return result.runs.map((r: Run) => r.id);
}

/**
 * Helper: get runs from runs-service for a given campaign
 */
async function getRunsForCampaign(clerkOrgId: string, campaignId: string): Promise<Run[]> {
  const runsOrgId = await ensureOrganization(clerkOrgId);
  const result = await listRuns({
    organizationId: runsOrgId,
    serviceName: "campaign-service",
    taskName: campaignId,
  });
  return result.runs;
}

/**
 * Helper: sum two AggregatedStats objects
 */
function sumStats(a: AggregatedStats, b: AggregatedStats): AggregatedStats {
  return {
    leadsFound: a.leadsFound + b.leadsFound,
    emailsGenerated: a.emailsGenerated + b.emailsGenerated,
    emailsSent: a.emailsSent + b.emailsSent,
    emailsOpened: a.emailsOpened + b.emailsOpened,
    emailsClicked: a.emailsClicked + b.emailsClicked,
    emailsReplied: a.emailsReplied + b.emailsReplied,
    emailsBounced: a.emailsBounced + b.emailsBounced,
    repliesWillingToMeet: a.repliesWillingToMeet + b.repliesWillingToMeet,
    repliesInterested: a.repliesInterested + b.repliesInterested,
    repliesNotInterested: a.repliesNotInterested + b.repliesNotInterested,
    repliesOutOfOffice: a.repliesOutOfOffice + b.repliesOutOfOffice,
    repliesUnsubscribe: a.repliesUnsubscribe + b.repliesUnsubscribe,
  };
}

const EMPTY_STATS: AggregatedStats = {
  leadsFound: 0, emailsGenerated: 0, emailsSent: 0, emailsOpened: 0,
  emailsClicked: 0, emailsReplied: 0, emailsBounced: 0,
  repliesWillingToMeet: 0, repliesInterested: 0, repliesNotInterested: 0,
  repliesOutOfOffice: 0, repliesUnsubscribe: 0,
};

/**
 * GET /internal/performance/leaderboard - Public performance leaderboard
 * No auth — internal network trust (same as /campaigns/all)
 * Aggregates stats across ALL campaigns grouped by brand and model
 */
router.get("/performance/leaderboard", async (_req, res) => {
  try {
    // 1. Fetch all campaigns with clerkOrgId
    const allCampaigns = await db
      .select({
        id: campaigns.id,
        brandId: campaigns.brandId,
        brandUrl: campaigns.brandUrl,
        clerkOrgId: orgs.clerkOrgId,
      })
      .from(campaigns)
      .innerJoin(orgs, eq(campaigns.orgId, orgs.id));

    if (allCampaigns.length === 0) {
      return res.json({ brands: [], models: [], hero: null, updatedAt: new Date().toISOString() });
    }

    // 2. Group campaigns by brand (brandId or brandDomain fallback)
    const brandGroups = new Map<string, {
      brandId: string | null;
      brandUrl: string | null;
      brandDomain: string | null;
      campaignsByOrg: Map<string, string[]>; // clerkOrgId -> campaignIds
    }>();

    for (const c of allCampaigns) {
      const domain = c.brandUrl ? extractDomain(c.brandUrl) : null;
      const brandKey = c.brandId || domain;
      if (!brandKey) continue;

      let group = brandGroups.get(brandKey);
      if (!group) {
        group = {
          brandId: c.brandId,
          brandUrl: c.brandUrl,
          brandDomain: domain,
          campaignsByOrg: new Map(),
        };
        brandGroups.set(brandKey, group);
      }

      const orgCampaigns = group.campaignsByOrg.get(c.clerkOrgId) || [];
      orgCampaigns.push(c.id);
      group.campaignsByOrg.set(c.clerkOrgId, orgCampaigns);
    }

    // 3. For each brand, get runs + stats (batched by org)
    const brandResults = [];
    const allRunIdsByOrg = new Map<string, string[]>(); // clerkOrgId -> all runIds (for model leaderboard)

    for (const [, group] of brandGroups) {
      let brandStats = { ...EMPTY_STATS };
      let brandCostCents = 0;

      for (const [clerkOrgId, campaignIds] of group.campaignsByOrg) {
        // Get runs for all campaigns in this org-brand group
        const brandOrgRunIds: string[] = [];
        for (const campaignId of campaignIds) {
          try {
            const runs = await getRunsForCampaign(clerkOrgId, campaignId);
            brandOrgRunIds.push(...runs.map((r: Run) => r.id));
          } catch (err) {
            console.warn(`Failed to get runs for campaign ${campaignId}:`, err);
          }
        }

        if (brandOrgRunIds.length === 0) continue;

        // Track for model leaderboard
        const existing = allRunIdsByOrg.get(clerkOrgId) || [];
        existing.push(...brandOrgRunIds);
        allRunIdsByOrg.set(clerkOrgId, existing);

        // Get stats and costs in parallel
        const [stats, runsMap] = await Promise.all([
          getAggregatedStats(brandOrgRunIds, clerkOrgId),
          getRunsBatch(brandOrgRunIds).catch(() => new Map() as Map<string, RunWithCosts>),
        ]);

        brandStats = sumStats(brandStats, stats);

        for (const run of runsMap.values()) {
          brandCostCents += parseFloat(run.totalCostInUsdCents) || 0;
        }
      }

      const sent = brandStats.emailsSent;
      brandResults.push({
        brandId: group.brandId,
        brandUrl: group.brandUrl,
        brandDomain: group.brandDomain,
        emailsSent: sent,
        emailsOpened: brandStats.emailsOpened,
        emailsClicked: brandStats.emailsClicked,
        emailsReplied: brandStats.emailsReplied,
        totalCostUsdCents: Math.round(brandCostCents),
        openRate: sent > 0 ? Math.round((brandStats.emailsOpened / sent) * 10000) / 10000 : 0,
        clickRate: sent > 0 ? Math.round((brandStats.emailsClicked / sent) * 10000) / 10000 : 0,
        replyRate: sent > 0 ? Math.round((brandStats.emailsReplied / sent) * 10000) / 10000 : 0,
        costPerOpenCents: brandStats.emailsOpened > 0 ? Math.round(brandCostCents / brandStats.emailsOpened) : null,
        costPerClickCents: brandStats.emailsClicked > 0 ? Math.round(brandCostCents / brandStats.emailsClicked) : null,
        costPerReplyCents: brandStats.emailsReplied > 0 ? Math.round(brandCostCents / brandStats.emailsReplied) : null,
      });
    }

    // 4. Model leaderboard — get email generation stats grouped by model
    const allRunIds = Array.from(allRunIdsByOrg.values()).flat();
    const modelStatsRaw = await getStatsByModel(allRunIds);

    // For each model, get postmark stats using the model's specific runIds
    const modelResults = [];
    for (const ms of modelStatsRaw) {
      // Get postmark stats for this model's runIds (batch by org)
      let modelAgg = { ...EMPTY_STATS };
      let modelCostCents = 0;

      // Group model runIds by org
      const modelRunsByOrg = new Map<string, string[]>();
      for (const [clerkOrgId, orgRunIds] of allRunIdsByOrg) {
        const intersection = ms.runIds.filter((rid) => orgRunIds.includes(rid));
        if (intersection.length > 0) {
          modelRunsByOrg.set(clerkOrgId, intersection);
        }
      }

      for (const [clerkOrgId, runIds] of modelRunsByOrg) {
        const [stats, runsMap] = await Promise.all([
          getAggregatedStats(runIds, clerkOrgId),
          getRunsBatch(runIds).catch(() => new Map() as Map<string, RunWithCosts>),
        ]);
        modelAgg = sumStats(modelAgg, stats);
        for (const run of runsMap.values()) {
          modelCostCents += parseFloat(run.totalCostInUsdCents) || 0;
        }
      }

      const sent = modelAgg.emailsSent;
      modelResults.push({
        model: ms.model,
        emailsGenerated: ms.count,
        emailsSent: sent,
        emailsOpened: modelAgg.emailsOpened,
        emailsClicked: modelAgg.emailsClicked,
        emailsReplied: modelAgg.emailsReplied,
        totalCostUsdCents: Math.round(modelCostCents),
        openRate: sent > 0 ? Math.round((modelAgg.emailsOpened / sent) * 10000) / 10000 : 0,
        clickRate: sent > 0 ? Math.round((modelAgg.emailsClicked / sent) * 10000) / 10000 : 0,
        replyRate: sent > 0 ? Math.round((modelAgg.emailsReplied / sent) * 10000) / 10000 : 0,
        costPerOpenCents: modelAgg.emailsOpened > 0 ? Math.round(modelCostCents / modelAgg.emailsOpened) : null,
        costPerClickCents: modelAgg.emailsClicked > 0 ? Math.round(modelCostCents / modelAgg.emailsClicked) : null,
        costPerReplyCents: modelAgg.emailsReplied > 0 ? Math.round(modelCostCents / modelAgg.emailsReplied) : null,
      });
    }

    // 5. Hero stats — best conversion rate & best value
    // Conversion = clicks (website visits) + replies
    let hero = null;
    if (modelResults.length > 0) {
      const withConversion = modelResults.map((m) => ({
        model: m.model,
        conversionRate: m.emailsSent > 0
          ? (m.emailsClicked + m.emailsReplied) / m.emailsSent
          : 0,
        conversionsPerDollar: m.totalCostUsdCents > 0
          ? ((m.emailsClicked + m.emailsReplied) / m.totalCostUsdCents) * 100 // per dollar (cents -> dollars)
          : 0,
      }));

      const bestConversion = withConversion.reduce((a, b) => a.conversionRate > b.conversionRate ? a : b);
      const bestValue = withConversion.reduce((a, b) => a.conversionsPerDollar > b.conversionsPerDollar ? a : b);

      hero = {
        bestConversionModel: {
          model: bestConversion.model,
          conversionRate: Math.round(bestConversion.conversionRate * 10000) / 10000,
        },
        bestValueModel: {
          model: bestValue.model,
          conversionsPerDollar: Math.round(bestValue.conversionsPerDollar * 100) / 100,
        },
      };
    }

    res.json({
      brands: brandResults,
      models: modelResults,
      hero,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Leaderboard error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /internal/campaigns - List all campaigns for org
 * Query params:
 * - brandId: optional, filter by brand ID (from brand-service)
 */
router.get("/campaigns", serviceAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const brandId = req.query.brandId as string;

    let orgCampaigns = await db.query.campaigns.findMany({
      where: eq(campaigns.orgId, req.orgId!),
      orderBy: (campaigns, { desc }) => [desc(campaigns.createdAt)],
    });

    // Filter by brandId if provided
    if (brandId) {
      orgCampaigns = orgCampaigns.filter(c => c.brandId === brandId);
    }

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
        personTitles: campaigns.personTitles,
        organizationLocations: campaigns.organizationLocations,
        qOrganizationKeywordTags: campaigns.qOrganizationKeywordTags,
        organizationNumEmployeesRanges: campaigns.organizationNumEmployeesRanges,
        qOrganizationIndustryTagIds: campaigns.qOrganizationIndustryTagIds,
        qKeywords: campaigns.qKeywords,
        maxBudgetDailyUsd: campaigns.maxBudgetDailyUsd,
        maxBudgetWeeklyUsd: campaigns.maxBudgetWeeklyUsd,
        maxBudgetMonthlyUsd: campaigns.maxBudgetMonthlyUsd,
        maxBudgetTotalUsd: campaigns.maxBudgetTotalUsd,
        maxLeads: campaigns.maxLeads,
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
      maxBudgetTotalUsd,
      maxLeads,
      startDate,
      endDate,
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

    // Validate at least one budget is set
    if (!maxBudgetDailyUsd && !maxBudgetWeeklyUsd && !maxBudgetMonthlyUsd && !maxBudgetTotalUsd) {
      return res.status(400).json({
        error: "At least one budget must be set (maxBudgetDailyUsd, maxBudgetWeeklyUsd, maxBudgetMonthlyUsd, or maxBudgetTotalUsd)"
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
      maxBudgetTotalUsd,
      maxLeads: maxLeads ? parseInt(maxLeads, 10) : null,
      startDate,
      endDate,
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

    const runs = await getRunsForCampaign(req.clerkOrgId!, id);

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

    const clerkOrgId = await getClerkOrgIdFromCampaign(id);
    if (!clerkOrgId) {
      return res.status(404).json({ error: "Campaign or org not found" });
    }

    const runs = await getRunsForCampaign(clerkOrgId, id);

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

    const clerkOrgId = await getClerkOrgIdFromCampaign(id);
    if (!clerkOrgId) {
      return res.status(404).json({ error: "Campaign or org not found" });
    }

    const runsOrgId = await ensureOrganization(clerkOrgId);
    const run = await createRun({
      organizationId: runsOrgId,
      serviceName: "campaign-service",
      taskName: id,
    });

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
    const { status } = req.body;

    if (status !== "completed" && status !== "failed") {
      return res.status(400).json({ error: "Status must be 'completed' or 'failed'" });
    }

    const run = await updateRun(id, status);

    res.json({ run });
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

    // Get all runs for this campaign from runs-service
    const runs = await getRunsForCampaign(req.clerkOrgId!, id);

    // Build debug response
    const debug = {
      campaign: {
        id: campaign.id,
        name: campaign.name,
        status: campaign.status,
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
          total: campaign.maxBudgetTotalUsd,
        },
      },
      runs: runs.map(run => ({
        id: run.id,
        status: run.status,
        startedAt: run.startedAt,
        completedAt: run.completedAt,
        createdAt: run.createdAt,
      })),
      summary: {
        totalRuns: runs.length,
        completed: runs.filter(r => r.status === "completed").length,
        failed: runs.filter(r => r.status === "failed").length,
        running: runs.filter(r => r.status === "running").length,
        lastRunAt: runs[0]?.createdAt || null,
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

    // Get all run IDs for this campaign from runs-service
    const runs = await getRunsForCampaign(req.clerkOrgId!, id);
    const runIds = runs.map(r => r.id);

    // Aggregate stats from other services + fetch run costs in parallel
    const [aggregated, runsWithCosts] = await Promise.all([
      getAggregatedStats(runIds, req.clerkOrgId!),
      runIds.length > 0
        ? getRunsBatch(runIds).catch((err) => {
            console.warn("Failed to fetch run costs for stats:", err);
            return new Map();
          })
        : Promise.resolve(new Map()),
    ]);

    // Sum total cost across all top-level runs (each includes recursive children costs)
    let totalCostInUsdCents = 0;
    for (const run of runsWithCosts.values()) {
      totalCostInUsdCents += parseFloat(run.totalCostInUsdCents) || 0;
    }

    // Build response with run stats + aggregated stats
    const stats = {
      campaignId: id,
      totalRuns: runs.length,
      completedRuns: runs.filter(r => r.status === "completed").length,
      failedRuns: runs.filter(r => r.status === "failed").length,
      runningRuns: runs.filter(r => r.status === "running").length,
      // Total cost
      totalCostInUsdCents: totalCostInUsdCents > 0 ? String(totalCostInUsdCents) : null,
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

    // Get all run IDs for this campaign from runs-service
    const runIds = await getRunIds(req.clerkOrgId!, id);

    // Fetch leads from apollo-service
    const leads = await getLeadsForRuns(runIds, req.clerkOrgId!);

    // Map to expected format
    const mappedLeads = leads.map(lead => ({
      id: lead.id,
      firstName: lead.firstName,
      lastName: lead.lastName,
      email: lead.email,
      title: lead.title,
      organizationName: lead.organizationName,
      linkedinUrl: lead.linkedinUrl,
      enrichmentRunId: lead.enrichmentRunId,
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

    // Get all run IDs for this campaign from runs-service
    const runIds = await getRunIds(req.clerkOrgId!, id);

    // Fetch leads from apollo-service
    const leads = await getLeadsForRuns(runIds, req.clerkOrgId!);

    // Aggregate into companies
    const companies = aggregateCompaniesFromLeads(leads);

    res.json({ companies });
  } catch (error) {
    console.error("Get campaign companies error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
