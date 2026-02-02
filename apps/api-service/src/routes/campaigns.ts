import { Router } from "express";
import { authenticate, requireOrg, AuthenticatedRequest } from "../middleware/auth.js";
import { callService, services, callExternalService, externalServices } from "../lib/service-client.js";
import { buildInternalHeaders } from "../lib/internal-headers.js";
import { getRunsBatch, type RunWithCosts } from "@mcpfactory/runs-client";

function sendLifecycleEmail(eventType: string, req: AuthenticatedRequest, metadata: Record<string, unknown>) {
  callExternalService(externalServices.lifecycle, "/send", {
    method: "POST",
    body: {
      appId: "mcpfactory",
      eventType,
      clerkOrgId: req.orgId,
      clerkUserId: req.userId,
      metadata,
    },
  }).catch((err) => console.warn(`[campaigns] Lifecycle email ${eventType} failed:`, err.message));
}

const router = Router();

/**
 * GET /v1/campaigns
 * List campaigns for the organization
 * Query params:
 * - brandId: optional, filter by brand ID from brand-service
 */
router.get("/campaigns", authenticate, requireOrg, async (req: AuthenticatedRequest, res) => {
  try {
    const brandId = req.query.brandId as string;
    const queryString = brandId ? `?brandId=${brandId}` : "";
    
    const result = await callService(
      services.campaign,
      `/internal/campaigns${queryString}`,
      {
        headers: buildInternalHeaders(req),
      }
    );
    res.json(result);
  } catch (error: any) {
    console.error("List campaigns error:", error);
    res.status(500).json({ error: error.message || "Failed to list campaigns" });
  }
});

/**
 * POST /v1/campaigns
 * Create a new campaign
 * 
 * If clientUrl is provided, scrapes the company info first and stores in company-service
 */
router.post("/campaigns", authenticate, requireOrg, async (req: AuthenticatedRequest, res) => {
  try {
    console.log("Create campaign - orgId:", req.orgId);
    
    // If brandUrl provided, scrape it first so company info is available for runs
    const { brandUrl } = req.body;
    if (brandUrl) {
      console.log("Scraping brand:", brandUrl);
      try {
        await callExternalService(
          externalServices.scraping,
          "/scrape",
          {
            method: "POST",
            body: {
              url: brandUrl,
              sourceService: "mcpfactory",
              sourceOrgId: req.orgId,
            },
          }
        );
        console.log("Brand scraped successfully");
      } catch (scrapeError: any) {
        console.warn("Failed to scrape brand (continuing anyway):", scrapeError.message);
        // Don't fail campaign creation if scrape fails - worker will handle missing data
      }
    }
    
    const result = await callService(
      services.campaign,
      "/internal/campaigns",
      {
        method: "POST",
        headers: buildInternalHeaders(req),
        body: req.body,
      }
    );

    // Fire-and-forget lifecycle email
    const campaign = (result as any).campaign;
    if (campaign) {
      sendLifecycleEmail("campaign_created", req, {
        campaignId: campaign.id,
        campaignName: req.body.name || campaign.name,
      });
    }

    res.json(result);
  } catch (error: any) {
    console.error("Create campaign error:", error.message, error.stack);
    res.status(500).json({ error: error.message || "Failed to create campaign" });
  }
});

/**
 * GET /v1/campaigns/:id
 * Get a specific campaign
 */
router.get("/campaigns/:id", authenticate, requireOrg, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    const result = await callService(
      services.campaign,
      `/internal/campaigns/${id}`,
      {
        headers: { "x-clerk-org-id": req.orgId! },
      }
    );
    res.json(result);
  } catch (error: any) {
    console.error("Get campaign error:", error);
    res.status(500).json({ error: error.message || "Failed to get campaign" });
  }
});

/**
 * PATCH /v1/campaigns/:id
 * Update a campaign
 */
router.patch("/campaigns/:id", authenticate, requireOrg, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    const result = await callService(
      services.campaign,
      `/internal/campaigns/${id}`,
      {
        method: "PATCH",
        headers: { "x-clerk-org-id": req.orgId! },
        body: req.body,
      }
    );
    res.json(result);
  } catch (error: any) {
    console.error("Update campaign error:", error);
    res.status(500).json({ error: error.message || "Failed to update campaign" });
  }
});

/**
 * POST /v1/campaigns/:id/stop
 * Stop a running campaign
 */
router.post("/campaigns/:id/stop", authenticate, requireOrg, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    const result = await callService(
      services.campaign,
      `/internal/campaigns/${id}/stop`,
      {
        method: "POST",
        headers: { "x-clerk-org-id": req.orgId! },
      }
    );

    // Fire-and-forget lifecycle email
    const campaign = (result as any).campaign;
    sendLifecycleEmail("campaign_stopped", req, {
      campaignId: id,
      campaignName: campaign?.name,
    });

    res.json(result);
  } catch (error: any) {
    console.error("Stop campaign error:", error);
    res.status(500).json({ error: error.message || "Failed to stop campaign" });
  }
});

/**
 * POST /v1/campaigns/:id/resume
 * Resume a stopped campaign
 */
router.post("/campaigns/:id/resume", authenticate, requireOrg, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    const result = await callService(
      services.campaign,
      `/internal/campaigns/${id}/resume`,
      {
        method: "POST",
        headers: { "x-clerk-org-id": req.orgId! },
      }
    );
    res.json(result);
  } catch (error: any) {
    console.error("Resume campaign error:", error);
    res.status(500).json({ error: error.message || "Failed to resume campaign" });
  }
});

/**
 * GET /v1/campaigns/:id/runs
 * Get campaign runs/history
 */
router.get("/campaigns/:id/runs", authenticate, requireOrg, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    const result = await callService(
      services.campaign,
      `/internal/campaigns/${id}/runs`,
      {
        headers: { "x-clerk-org-id": req.orgId! },
      }
    );
    res.json(result);
  } catch (error: any) {
    console.error("Get campaign runs error:", error);
    res.status(500).json({ error: error.message || "Failed to get campaign runs" });
  }
});

/**
 * GET /v1/campaigns/:id/stats
 * Get campaign statistics
 */
router.get("/campaigns/:id/stats", authenticate, requireOrg, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    const result = await callService(
      services.campaign,
      `/internal/campaigns/${id}/stats`,
      {
        headers: { "x-clerk-org-id": req.orgId! },
      }
    );
    res.json(result);
  } catch (error: any) {
    console.error("Get campaign stats error:", error);
    res.status(500).json({ error: error.message || "Failed to get campaign stats" });
  }
});

/**
 * GET /v1/campaigns/:id/debug
 * Get detailed debug info for a campaign
 */
router.get("/campaigns/:id/debug", authenticate, requireOrg, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    const result = await callService(
      services.campaign,
      `/internal/campaigns/${id}/debug`,
      {
        headers: { "x-clerk-org-id": req.orgId! },
      }
    );
    res.json(result);
  } catch (error: any) {
    console.error("Get campaign debug error:", error);
    res.status(500).json({ error: error.message || "Failed to get campaign debug info" });
  }
});

/**
 * GET /v1/campaigns/:id/leads
 * Get all leads for a campaign
 */
router.get("/campaigns/:id/leads", authenticate, requireOrg, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    const result = await callService(
      services.campaign,
      `/internal/campaigns/${id}/leads`,
      {
        headers: { "x-clerk-org-id": req.orgId! },
      }
    );
    res.json(result);
  } catch (error: any) {
    console.error("Get campaign leads error:", error);
    res.status(500).json({ error: error.message || "Failed to get campaign leads" });
  }
});

/**
 * GET /v1/campaigns/:id/companies
 * Get all companies for a campaign
 */
router.get("/campaigns/:id/companies", authenticate, requireOrg, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    const result = await callService(
      services.campaign,
      `/internal/campaigns/${id}/companies`,
      {
        headers: { "x-clerk-org-id": req.orgId! },
      }
    );
    res.json(result);
  } catch (error: any) {
    console.error("Get campaign companies error:", error);
    res.status(500).json({ error: error.message || "Failed to get campaign companies" });
  }
});

/**
 * GET /v1/campaigns/:id/emails
 * Get all generated emails for a campaign (across all runs)
 */
router.get("/campaigns/:id/emails", authenticate, requireOrg, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    // 1. Get all runs for this campaign
    const runsResult = await callService(
      services.campaign,
      `/internal/campaigns/${id}/runs`,
      {
        headers: { "x-clerk-org-id": req.orgId! },
      }
    ) as { runs: Array<{ id: string }> };

    const runs = runsResult.runs || [];
    
    if (runs.length === 0) {
      return res.json({ emails: [] });
    }

    // 2. Get emails for each run from emailgeneration-service
    const allEmails: Array<Record<string, unknown>> = [];
    for (const run of runs) {
      try {
        const emailsResult = await callService(
          services.emailgen,
          `/generations/${run.id}`,
          {
            headers: { "x-clerk-org-id": req.orgId! },
          }
        ) as { generations: Array<Record<string, unknown>> };

        if (emailsResult.generations) {
          allEmails.push(...emailsResult.generations);
        }
      } catch (err) {
        // Continue if one run fails
        console.warn(`Failed to get emails for run ${run.id}:`, err);
      }
    }

    // 3. Batch-fetch generation run costs from runs-service
    const generationRunIds = allEmails
      .map((e) => e.generationRunId as string | undefined)
      .filter((id): id is string => !!id);

    let runMap = new Map<string, RunWithCosts>();
    if (generationRunIds.length > 0) {
      try {
        runMap = await getRunsBatch(generationRunIds);
      } catch (err) {
        console.warn("Failed to fetch run costs:", err);
      }
    }

    // 4. Attach run data to each email
    const emailsWithRuns = allEmails.map((email) => {
      const run = email.generationRunId ? runMap.get(email.generationRunId as string) : undefined;
      return {
        ...email,
        generationRun: run
          ? {
              status: run.status,
              startedAt: run.startedAt,
              completedAt: run.completedAt,
              totalCostInUsdCents: run.totalCostInUsdCents,
              costs: run.costs,
            }
          : null,
      };
    });

    res.json({ emails: emailsWithRuns });
  } catch (error: any) {
    console.error("Get campaign emails error:", error);
    res.status(500).json({ error: error.message || "Failed to get campaign emails" });
  }
});

export default router;
