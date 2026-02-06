import { Router } from "express";
import { authenticate, requireOrg, AuthenticatedRequest } from "../middleware/auth.js";
import { callExternalService, externalServices } from "../lib/service-client.js";

const router = Router();

/**
 * GET /v1/keys
 * List BYOK keys for the organization
 */
router.get("/keys", authenticate, requireOrg, async (req: AuthenticatedRequest, res) => {
  // #swagger.tags = ['Keys']
  // #swagger.summary = 'List BYOK keys'
  // #swagger.description = 'List all BYOK (Bring Your Own Key) API keys for the organization'
  // #swagger.security = [{ "bearerAuth": [] }, { "apiKey": [] }]
  try {
    const result = await callExternalService(
      externalServices.key,
      `/internal/keys?clerkOrgId=${req.orgId}`
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
  // #swagger.tags = ['Keys']
  // #swagger.summary = 'Add a BYOK key'
  // #swagger.description = 'Store a new BYOK API key for a provider (e.g. openai, anthropic, apollo)'
  // #swagger.security = [{ "bearerAuth": [] }, { "apiKey": [] }]
  /* #swagger.requestBody = {
    required: true,
    content: {
      "application/json": {
        schema: {
          type: "object",
          required: ["provider", "apiKey"],
          properties: {
            provider: { type: "string", description: "Provider name (e.g. openai, anthropic, apollo)" },
            apiKey: { type: "string", description: "The API key value" }
          }
        }
      }
    }
  } */
  try {
    const { provider, apiKey } = req.body;

    if (!provider || !apiKey) {
      return res.status(400).json({ error: "provider and apiKey required" });
    }

    const result = await callExternalService(
      externalServices.key,
      "/internal/keys",
      {
        method: "POST",
        body: { clerkOrgId: req.orgId, provider, apiKey },
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
  // #swagger.tags = ['Keys']
  // #swagger.summary = 'Delete a BYOK key'
  // #swagger.description = 'Remove a BYOK API key for a specific provider'
  // #swagger.security = [{ "bearerAuth": [] }, { "apiKey": [] }]
  try {
    const { provider } = req.params;

    const result = await callExternalService(
      externalServices.key,
      `/internal/keys/${provider}?clerkOrgId=${req.orgId}`,
      { method: "DELETE" }
    );
    res.json(result);
  } catch (error: any) {
    console.error("Delete key error:", error);
    res.status(500).json({ error: error.message || "Failed to delete key" });
  }
});

/**
 * GET /internal/keys/:provider/decrypt
 * Get decrypted BYOK key (for internal service-to-service use)
 * Requires X-API-Key header for service auth
 */
router.get("/internal/keys/:provider/decrypt", async (req, res) => {
  // #swagger.tags = ['Keys']
  // #swagger.summary = 'Decrypt a BYOK key (internal)'
  // #swagger.description = 'Get decrypted BYOK key value. Internal service-to-service endpoint.'
  try {
    const { provider } = req.params;
    const clerkOrgId = req.query.clerkOrgId as string;

    if (!clerkOrgId) {
      return res.status(400).json({ error: "clerkOrgId required" });
    }

    const result = await callExternalService(
      externalServices.key,
      `/internal/keys/${provider}/decrypt?clerkOrgId=${clerkOrgId}`
    );
    res.json(result);
  } catch (error: any) {
    if (error.message?.includes("404")) {
      return res.status(404).json({ error: `${req.params.provider} key not configured` });
    }
    console.error("Decrypt key error:", error);
    res.status(500).json({ error: error.message || "Failed to decrypt key" });
  }
});

/**
 * POST /v1/api-keys/session
 * Get or create a session API key for Foxy chat
 */
router.post("/api-keys/session", authenticate, requireOrg, async (req: AuthenticatedRequest, res) => {
  // #swagger.tags = ['API Keys']
  // #swagger.summary = 'Get or create session API key'
  // #swagger.description = 'Get or create a short-lived session API key for Foxy chat integration'
  // #swagger.security = [{ "bearerAuth": [] }, { "apiKey": [] }]
  try {
    const result = await callExternalService(
      externalServices.key,
      "/internal/api-keys/session",
      {
        method: "POST",
        body: { clerkOrgId: req.orgId },
      }
    );
    res.json(result);
  } catch (error: any) {
    console.error("Session API key error:", error);
    res.status(500).json({ error: error.message || "Failed to get session API key" });
  }
});

/**
 * POST /v1/api-keys
 * Generate a new API key for the organization
 */
router.post("/api-keys", authenticate, requireOrg, async (req: AuthenticatedRequest, res) => {
  // #swagger.tags = ['API Keys']
  // #swagger.summary = 'Create an API key'
  // #swagger.description = 'Generate a new permanent API key for the organization'
  // #swagger.security = [{ "bearerAuth": [] }, { "apiKey": [] }]
  /* #swagger.requestBody = {
    required: true,
    content: {
      "application/json": {
        schema: {
          type: "object",
          properties: {
            name: { type: "string", description: "Human-readable name for the API key" }
          }
        }
      }
    }
  } */
  try {
    const { name } = req.body;

    const result = await callExternalService(
      externalServices.key,
      "/internal/api-keys",
      {
        method: "POST",
        body: { clerkOrgId: req.orgId, name },
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
  // #swagger.tags = ['API Keys']
  // #swagger.summary = 'List API keys'
  // #swagger.description = 'List all API keys for the organization'
  // #swagger.security = [{ "bearerAuth": [] }, { "apiKey": [] }]
  try {
    const result = await callExternalService(
      externalServices.key,
      `/internal/api-keys?clerkOrgId=${req.orgId}`
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
  // #swagger.tags = ['API Keys']
  // #swagger.summary = 'Revoke an API key'
  // #swagger.description = 'Delete/revoke an API key by ID'
  // #swagger.security = [{ "bearerAuth": [] }, { "apiKey": [] }]
  try {
    const { id } = req.params;

    const result = await callExternalService(
      externalServices.key,
      `/internal/api-keys/${id}`,
      {
        method: "DELETE",
        body: { clerkOrgId: req.orgId },
      }
    );
    res.json(result);
  } catch (error: any) {
    console.error("Delete API key error:", error);
    res.status(500).json({ error: error.message || "Failed to delete API key" });
  }
});

export default router;
