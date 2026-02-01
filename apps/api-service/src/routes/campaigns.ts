import { Router } from "express";
import { authenticate, requireOrg, AuthenticatedRequest } from "../middleware/auth.js";
import { callService, services, callExternalService, externalServices } from "../lib/service-client.js";
import { buildInternalHeaders } from "../lib/internal-headers.js";

const router = Router();

/**
 * GET /v1/campaigns
 * List campaigns for the organization
 * Query params:
 * - brandId: optional, filter by brand ID (preferred)
 * - brandUrl: optional, filter by brand URL (legacy)
 */
router.get("/campaigns", authenticate, requireOrg, async (req: AuthenticatedRequest, res) => {
  try {
    // Build query string with optional filters
    const brandId = req.query.brandId as string;
    const brandUrl = req.query.brandUrl as string;
    
    const params = new URLSearchParams();
    if (brandId) params.set("brandId", brandId);
    else if (brandUrl) params.set("brandUrl", brandUrl);
    
    const queryString = params.toString() ? `?${params.toString()}` : "";
    
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
    const allEmails: unknown[] = [];
    for (const run of runs) {
      try {
        const emailsResult = await callService(
          services.emailgen,
          `/generations/${run.id}`,
          {
            headers: { "x-clerk-org-id": req.orgId! },
          }
        ) as { generations: unknown[] };
        
        if (emailsResult.generations) {
          allEmails.push(...emailsResult.generations);
        }
      } catch (err) {
        // Continue if one run fails
        console.warn(`Failed to get emails for run ${run.id}:`, err);
      }
    }

    res.json({ emails: allEmails });
  } catch (error: any) {
    console.error("Get campaign emails error:", error);
    res.status(500).json({ error: error.message || "Failed to get campaign emails" });
  }
});

export default router;
