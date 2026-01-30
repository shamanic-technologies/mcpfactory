import { Router } from "express";
import { serviceAuth, AuthenticatedRequest } from "../middleware/auth.js";
import { getIndustries, getEmployeeRanges } from "../lib/reference-cache.js";
import { getByokKey } from "../lib/keys-client.js";

const router = Router();

/**
 * GET /reference/industries - Get Apollo industries list (24h cached)
 */
router.get("/reference/industries", serviceAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const apolloApiKey = await getByokKey(req.clerkOrgId!, "apollo");
    const industries = await getIndustries(apolloApiKey, req.orgId!);
    res.json({ industries });
  } catch (error) {
    console.error("Get industries error:", error);
    res.status(500).json({ error: error instanceof Error ? error.message : "Internal server error" });
  }
});

/**
 * GET /reference/employee-ranges - Get employee range options
 */
router.get("/reference/employee-ranges", serviceAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const ranges = await getEmployeeRanges(req.orgId!);
    res.json({ ranges });
  } catch (error) {
    console.error("Get employee ranges error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
