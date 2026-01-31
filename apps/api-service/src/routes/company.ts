import { Router } from "express";
import { authenticate, AuthenticatedRequest } from "../middleware/auth.js";

const router = Router();

const COMPANY_SERVICE_URL = process.env.COMPANY_SERVICE_URL || "http://localhost:3008";
const COMPANY_SERVICE_API_KEY = process.env.COMPANY_SERVICE_API_KEY;

/**
 * POST /v1/company/scrape
 * Scrape company information from a URL
 */
router.post("/company/scrape", authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: "url is required" });
    }

    // Call company-service
    const response = await fetch(`${COMPANY_SERVICE_URL}/organizations/scrape`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": COMPANY_SERVICE_API_KEY || "",
      },
      body: JSON.stringify({
        url,
        clerkOrganizationId: req.orgId,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Scrape failed" }));
      return res.status(response.status).json(error);
    }

    const result = await response.json();
    res.json(result);
  } catch (error: any) {
    console.error("Company scrape error:", error);
    res.status(500).json({ error: error.message || "Failed to scrape company" });
  }
});

/**
 * GET /v1/company/:id
 * Get company by ID
 */
router.get("/company/:id", authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    const response = await fetch(`${COMPANY_SERVICE_URL}/organizations/${id}`, {
      headers: {
        "X-API-Key": COMPANY_SERVICE_API_KEY || "",
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Not found" }));
      return res.status(response.status).json(error);
    }

    const result = await response.json();
    res.json(result);
  } catch (error: any) {
    console.error("Get company error:", error);
    res.status(500).json({ error: error.message || "Failed to get company" });
  }
});

export default router;
