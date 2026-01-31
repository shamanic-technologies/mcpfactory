import { Router } from "express";
import { authenticate, requireOrg, AuthenticatedRequest } from "../middleware/auth.js";
import { callService, services } from "../lib/service-client.js";

const router = Router();

/**
 * POST /v1/search/leads
 * Search for leads using Apollo
 */
router.post("/search/leads", authenticate, requireOrg, async (req: AuthenticatedRequest, res) => {
  try {
    const result = await callService(
      services.apollo,
      "/search",
      {
        method: "POST",
        body: { ...req.body, orgId: req.orgId },
      }
    );
    res.json(result);
  } catch (error: any) {
    console.error("Search leads error:", error);
    res.status(500).json({ error: error.message || "Failed to search leads" });
  }
});

/**
 * GET /v1/search/reference/industries
 * Get Apollo industry list
 */
router.get("/search/reference/industries", authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const result = await callService(
      services.apollo,
      "/reference/industries"
    );
    res.json(result);
  } catch (error: any) {
    console.error("Get industries error:", error);
    res.status(500).json({ error: error.message || "Failed to get industries" });
  }
});

/**
 * GET /v1/search/reference/employee-ranges
 * Get Apollo employee range options
 */
router.get("/search/reference/employee-ranges", authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const result = await callService(
      services.apollo,
      "/reference/employee-ranges"
    );
    res.json(result);
  } catch (error: any) {
    console.error("Get employee ranges error:", error);
    res.status(500).json({ error: error.message || "Failed to get employee ranges" });
  }
});

/**
 * GET /v1/search/reference/revenue-ranges
 * Get Apollo revenue range options
 */
router.get("/search/reference/revenue-ranges", authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const result = await callService(
      services.apollo,
      "/reference/revenue-ranges"
    );
    res.json(result);
  } catch (error: any) {
    console.error("Get revenue ranges error:", error);
    res.status(500).json({ error: error.message || "Failed to get revenue ranges" });
  }
});

export default router;
