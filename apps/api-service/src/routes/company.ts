import { Router } from "express";
import { authenticate, AuthenticatedRequest } from "../middleware/auth.js";
import { callExternalService, externalServices } from "../lib/service-client.js";

const router = Router();

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

    const result = await callExternalService(
      externalServices.company,
      "/organizations/scrape",
      {
        method: "POST",
        body: {
          url,
          clerkOrganizationId: req.orgId,
        },
      }
    );

    res.json(result);
  } catch (error: any) {
    console.error("Company scrape error:", error.message);
    res.status(500).json({ 
      error: error.message || "Failed to scrape company",
      details: error.stack?.split('\n').slice(0, 3).join(' ')
    });
  }
});

/**
 * GET /v1/company/:id
 * Get company by ID
 */
router.get("/company/:id", authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    const result = await callExternalService(
      externalServices.company,
      `/organizations/${id}`
    );

    res.json(result);
  } catch (error: any) {
    console.error("Get company error:", error);
    res.status(500).json({ error: error.message || "Failed to get company" });
  }
});

export default router;
