import { Router } from "express";
import { authenticate, requireOrg, AuthenticatedRequest } from "../middleware/auth.js";
import { callService, services } from "../lib/service-client.js";

const router = Router();

/**
 * GET /v1/keys
 * List BYOK keys for the organization
 */
router.get("/keys", authenticate, requireOrg, async (req: AuthenticatedRequest, res) => {
  try {
    const result = await callService(
      services.keys,
      `/keys?orgId=${req.orgId}`
    );
    res.json(result);
  } catch (error: any) {
    console.error("List keys error:", error);
    res.status(500).json({ error: error.message || "Failed to list keys" });
  }
});

/**
 * POST /v1/keys
 * Add a BYOK key
 */
router.post("/keys", authenticate, requireOrg, async (req: AuthenticatedRequest, res) => {
  try {
    const { provider, apiKey } = req.body;

    if (!provider || !apiKey) {
      return res.status(400).json({ error: "provider and apiKey required" });
    }

    const result = await callService(
      services.keys,
      "/keys",
      {
        method: "POST",
        body: { orgId: req.orgId, provider, apiKey },
      }
    );
    res.json(result);
  } catch (error: any) {
    console.error("Add key error:", error);
    res.status(500).json({ error: error.message || "Failed to add key" });
  }
});

/**
 * DELETE /v1/keys/:provider
 * Remove a BYOK key
 */
router.delete("/keys/:provider", authenticate, requireOrg, async (req: AuthenticatedRequest, res) => {
  try {
    const { provider } = req.params;

    const result = await callService(
      services.keys,
      `/keys/${provider}?orgId=${req.orgId}`,
      { method: "DELETE" }
    );
    res.json(result);
  } catch (error: any) {
    console.error("Delete key error:", error);
    res.status(500).json({ error: error.message || "Failed to delete key" });
  }
});

/**
 * POST /v1/api-keys
 * Generate a new API key for the organization
 */
router.post("/api-keys", authenticate, requireOrg, async (req: AuthenticatedRequest, res) => {
  try {
    const { name } = req.body;

    const result = await callService(
      services.keys,
      "/api-keys",
      {
        method: "POST",
        body: { orgId: req.orgId, userId: req.userId, name },
      }
    );
    res.json(result);
  } catch (error: any) {
    console.error("Create API key error:", error);
    res.status(500).json({ error: error.message || "Failed to create API key" });
  }
});

/**
 * GET /v1/api-keys
 * List API keys for the organization
 */
router.get("/api-keys", authenticate, requireOrg, async (req: AuthenticatedRequest, res) => {
  try {
    const result = await callService(
      services.keys,
      `/api-keys?orgId=${req.orgId}`
    );
    res.json(result);
  } catch (error: any) {
    console.error("List API keys error:", error);
    res.status(500).json({ error: error.message || "Failed to list API keys" });
  }
});

/**
 * DELETE /v1/api-keys/:id
 * Revoke an API key
 */
router.delete("/api-keys/:id", authenticate, requireOrg, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    const result = await callService(
      services.keys,
      `/api-keys/${id}?orgId=${req.orgId}`,
      { method: "DELETE" }
    );
    res.json(result);
  } catch (error: any) {
    console.error("Delete API key error:", error);
    res.status(500).json({ error: error.message || "Failed to delete API key" });
  }
});

export default router;
