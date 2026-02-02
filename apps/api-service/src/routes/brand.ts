import { Router } from "express";
import { authenticate, requireOrg, AuthenticatedRequest } from "../middleware/auth.js";
import { callExternalService, externalServices } from "../lib/service-client.js";

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
