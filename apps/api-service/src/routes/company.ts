import { Router } from "express";
import { authenticate, requireOrg, AuthenticatedRequest } from "../middleware/auth.js";
import { callExternalService, externalServices } from "../lib/service-client.js";

// Company service URL (for sales profiles)
const COMPANY_SERVICE_URL = process.env.COMPANY_SERVICE_URL || "https://company.mcpfactory.org";
const COMPANY_SERVICE_API_KEY = process.env.COMPANY_SERVICE_API_KEY || "";

const router = Router();

/**
 * POST /v1/company/scrape
 * Scrape company information from a URL using scraping-service
 */
router.post("/company/scrape", authenticate, async (req: AuthenticatedRequest, res) => {
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
    console.error("Company scrape error:", error.message);
    res.status(500).json({ error: error.message || "Failed to scrape company" });
  }
});

/**
 * GET /v1/company/by-url
 * Get cached company info by URL
 */
router.get("/company/by-url", authenticate, async (req: AuthenticatedRequest, res) => {
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
    console.error("Get company error:", error);
    res.status(500).json({ error: error.message || "Failed to get company" });
  }
});

/**
 * GET /v1/company/sales-profiles
 * Get all sales profiles for the organization
 * NOTE: Must be before /:id route to avoid matching "sales-profiles" as an id
 */
router.get("/company/sales-profiles", authenticate, requireOrg, async (req: AuthenticatedRequest, res) => {
  try {
    const response = await fetch(
      `${COMPANY_SERVICE_URL}/sales-profiles?clerkOrgId=${req.orgId}`,
      {
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": COMPANY_SERVICE_API_KEY,
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
 * GET /v1/company/:id
 * Get company scrape result by ID
 */
router.get("/company/:id", authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    const result = await callExternalService(
      externalServices.scraping,
      `/scrape/${id}`
    );

    res.json(result);
  } catch (error: any) {
    console.error("Get company error:", error);
    res.status(500).json({ error: error.message || "Failed to get company" });
  }
});

export default router;
