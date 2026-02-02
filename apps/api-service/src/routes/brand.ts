import { Router } from "express";
import { authenticate, requireOrg, AuthenticatedRequest } from "../middleware/auth.js";
import { callExternalService, callService, externalServices, services } from "../lib/service-client.js";
import { getRunsBatch, type RunWithCosts } from "@mcpfactory/runs-client";

// Brand service URL (for sales profiles)
const BRAND_SERVICE_URL = process.env.BRAND_SERVICE_URL || "https://brand.mcpfactory.org";
const BRAND_SERVICE_API_KEY = process.env.BRAND_SERVICE_API_KEY || "";

const router = Router();

/**
 * POST /v1/brand/scrape
 * Scrape brand information from a URL using scraping-service
 */
router.post("/brand/scrape", authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const { url, skipCache } = req.body;

    if (!url) {
      return res.status(400).json({ error: "url is required" });
    }

    const result = await callExternalService(
      externalServices.scraping,
      "/scrape",
      {
        method: "POST",
        body: {
          url,
          sourceService: "mcpfactory",
          sourceOrgId: req.orgId,
          skipCache,
        },
      }
    );

    res.json(result);
  } catch (error: any) {
    console.error("Brand scrape error:", error.message);
    res.status(500).json({ error: error.message || "Failed to scrape brand" });
  }
});

/**
 * GET /v1/brand/by-url
 * Get cached brand info by URL
 */
router.get("/brand/by-url", authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const url = req.query.url as string;

    if (!url) {
      return res.status(400).json({ error: "url query param is required" });
    }

    const result = await callExternalService(
      externalServices.scraping,
      `/scrape/by-url?url=${encodeURIComponent(url)}`
    );

    res.json(result);
  } catch (error: any) {
    console.error("Get brand error:", error);
    res.status(500).json({ error: error.message || "Failed to get brand" });
  }
});

/**
 * GET /v1/brands
 * Get all brands for the organization (for dashboard)
 */
router.get("/brands", authenticate, requireOrg, async (req: AuthenticatedRequest, res) => {
  try {
    const response = await fetch(
      `${BRAND_SERVICE_URL}/brands?clerkOrgId=${req.orgId}`,
      {
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": BRAND_SERVICE_API_KEY,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Unknown error" }));
      throw new Error(error.error || `Failed to fetch brands: ${response.status}`);
    }

    const result = await response.json();
    res.json(result);
  } catch (error: any) {
    console.error("Get brands error:", error);
    res.status(500).json({ error: error.message || "Failed to get brands" });
  }
});

/**
 * GET /v1/brands/:id
 * Get a single brand by ID from brand-service
 */
router.get("/brands/:id", authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    const response = await fetch(
      `${BRAND_SERVICE_URL}/brands/${id}`,
      {
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": BRAND_SERVICE_API_KEY,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Unknown error" }));
      throw new Error(error.error || `Failed to fetch brand: ${response.status}`);
    }

    const result = await response.json();
    res.json(result);
  } catch (error: any) {
    console.error("Get brand by id error:", error);
    res.status(500).json({ error: error.message || "Failed to get brand" });
  }
});

/**
 * GET /v1/brands/:id/sales-profile
 * Get sales profile for a specific brand
 */
router.get("/brands/:id/sales-profile", authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    const response = await fetch(
      `${BRAND_SERVICE_URL}/brands/${id}/sales-profile`,
      {
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": BRAND_SERVICE_API_KEY,
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return res.status(404).json({ error: "Sales profile not found" });
      }
      const error = await response.json().catch(() => ({ error: "Unknown error" }));
      throw new Error(error.error || `Failed to fetch sales profile: ${response.status}`);
    }

    const result = await response.json();
    res.json(result);
  } catch (error: any) {
    console.error("Get brand sales profile error:", error);
    res.status(500).json({ error: error.message || "Failed to get sales profile" });
  }
});

/**
 * GET /v1/brand/sales-profiles
 * Get all sales profiles (brands) for the organization
 * NOTE: Must be before /:id route to avoid matching "sales-profiles" as an id
 */
router.get("/brand/sales-profiles", authenticate, requireOrg, async (req: AuthenticatedRequest, res) => {
  try {
    const response = await fetch(
      `${BRAND_SERVICE_URL}/sales-profiles?clerkOrgId=${req.orgId}`,
      {
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": BRAND_SERVICE_API_KEY,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Unknown error" }));
      throw new Error(error.error || `Failed to fetch profiles: ${response.status}`);
    }

    const result = await response.json();
    res.json(result);
  } catch (error: any) {
    console.error("Get sales profiles error:", error);
    res.status(500).json({ error: error.message || "Failed to get sales profiles" });
  }
});

/**
 * POST /v1/brand/icp-suggestion
 * Get ICP suggestion (Apollo-compatible search params) for a brand URL
 */
router.post("/brand/icp-suggestion", authenticate, requireOrg, async (req: AuthenticatedRequest, res) => {
  try {
    const { brandUrl } = req.body;

    if (!brandUrl) {
      return res.status(400).json({ error: "brandUrl is required" });
    }

    const response = await fetch(
      `${BRAND_SERVICE_URL}/icp-suggestion`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": BRAND_SERVICE_API_KEY,
        },
        body: JSON.stringify({
          clerkOrgId: req.orgId,
          url: brandUrl,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Unknown error" }));
      throw new Error(error.error || `Failed to get ICP suggestion: ${response.status}`);
    }

    const result = await response.json();
    res.json(result);
  } catch (error: any) {
    console.error("ICP suggestion error:", error.message);
    res.status(500).json({ error: error.message || "Failed to get ICP suggestion" });
  }
});

/**
 * GET /v1/brands/:id/runs
 * Get all campaign runs for a brand (for update history)
 */
router.get("/brands/:id/runs", authenticate, requireOrg, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    // 1. Get campaigns for this brand
    const campaignsResult = await callService<{ campaigns: Array<{ id: string; name: string }> }>(
      services.campaign,
      `/internal/campaigns?brandId=${id}`,
      { headers: { "x-clerk-org-id": req.orgId! } }
    );
    const campaigns = campaignsResult.campaigns || [];

    if (campaigns.length === 0) {
      return res.json({ runs: [] });
    }

    // 2. Get runs for each campaign
    interface RunEntry { id: string; status: string; startedAt: string; completedAt: string | null }
    const allRuns: Array<RunEntry & { campaignId: string; campaignName: string }> = [];

    for (const campaign of campaigns) {
      try {
        const runsResult = await callService<{ runs: RunEntry[] }>(
          services.campaign,
          `/internal/campaigns/${campaign.id}/runs`,
          { headers: { "x-clerk-org-id": req.orgId! } }
        );
        for (const run of runsResult.runs || []) {
          allRuns.push({ ...run, campaignId: campaign.id, campaignName: campaign.name });
        }
      } catch (err) {
        console.warn(`Failed to get runs for campaign ${campaign.id}:`, err);
      }
    }

    if (allRuns.length === 0) {
      return res.json({ runs: [] });
    }

    // 3. Batch-fetch RunWithCosts
    const runIds = allRuns.map((r) => r.id);
    let runMap = new Map<string, RunWithCosts>();
    try {
      runMap = await getRunsBatch(runIds);
    } catch (err) {
      console.warn("Failed to fetch run costs for brand runs:", err);
    }

    // 4. Build response sorted by startedAt desc
    const runs = allRuns
      .map((run) => {
        const withCosts = runMap.get(run.id);
        return {
          id: run.id,
          campaignId: run.campaignId,
          campaignName: run.campaignName,
          status: withCosts?.status || run.status,
          startedAt: withCosts?.startedAt || run.startedAt,
          completedAt: withCosts?.completedAt || run.completedAt,
          totalCostInUsdCents: withCosts?.totalCostInUsdCents || null,
          costs: withCosts?.costs || [],
        };
      })
      .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());

    res.json({ runs });
  } catch (error: any) {
    console.error("Get brand runs error:", error);
    res.status(500).json({ error: error.message || "Failed to get brand runs" });
  }
});

/**
 * GET /v1/brand/:id
 * Get brand scrape result by ID
 */
router.get("/brand/:id", authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    const result = await callExternalService(
      externalServices.scraping,
      `/scrape/${id}`
    );

    res.json(result);
  } catch (error: any) {
    console.error("Get brand error:", error);
    res.status(500).json({ error: error.message || "Failed to get brand" });
  }
});

export default router;
