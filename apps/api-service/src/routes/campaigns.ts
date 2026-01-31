import { Router } from "express";
import { authenticate, requireOrg, AuthenticatedRequest } from "../middleware/auth.js";
import { callService, services } from "../lib/service-client.js";

const router = Router();

/**
 * GET /v1/campaigns
 * List campaigns for the organization
 */
router.get("/campaigns", authenticate, requireOrg, async (req: AuthenticatedRequest, res) => {
  try {
    const result = await callService(
      services.campaign,
      `/campaigns?orgId=${req.orgId}`
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
 */
router.post("/campaigns", authenticate, requireOrg, async (req: AuthenticatedRequest, res) => {
  try {
    const result = await callService(
      services.campaign,
      "/campaigns",
      {
        method: "POST",
        body: { ...req.body, orgId: req.orgId },
      }
    );
    res.json(result);
  } catch (error: any) {
    console.error("Create campaign error:", error);
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
      `/campaigns/${id}?orgId=${req.orgId}`
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
      `/campaigns/${id}`,
      {
        method: "PATCH",
        body: { ...req.body, orgId: req.orgId },
      }
    );
    res.json(result);
  } catch (error: any) {
    console.error("Update campaign error:", error);
    res.status(500).json({ error: error.message || "Failed to update campaign" });
  }
});

/**
 * POST /v1/campaigns/:id/start
 * Start a campaign
 */
router.post("/campaigns/:id/start", authenticate, requireOrg, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    const result = await callService(
      services.campaign,
      `/campaigns/${id}/start`,
      {
        method: "POST",
        body: { orgId: req.orgId },
      }
    );
    res.json(result);
  } catch (error: any) {
    console.error("Start campaign error:", error);
    res.status(500).json({ error: error.message || "Failed to start campaign" });
  }
});

/**
 * POST /v1/campaigns/:id/pause
 * Pause a campaign
 */
router.post("/campaigns/:id/pause", authenticate, requireOrg, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    const result = await callService(
      services.campaign,
      `/campaigns/${id}/pause`,
      {
        method: "POST",
        body: { orgId: req.orgId },
      }
    );
    res.json(result);
  } catch (error: any) {
    console.error("Pause campaign error:", error);
    res.status(500).json({ error: error.message || "Failed to pause campaign" });
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
      `/campaigns/${id}/runs?orgId=${req.orgId}`
    );
    res.json(result);
  } catch (error: any) {
    console.error("Get campaign runs error:", error);
    res.status(500).json({ error: error.message || "Failed to get campaign runs" });
  }
});

export default router;
