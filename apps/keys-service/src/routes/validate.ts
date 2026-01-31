import { Router } from "express";
import { eq, and } from "drizzle-orm";
import { db } from "../db/index.js";
import { orgs, byokKeys } from "../db/schema.js";
import { apiKeyAuth, AuthenticatedRequest } from "../middleware/auth.js";
import { decrypt } from "../lib/crypto.js";

const router = Router();

/**
 * GET /validate - Validate API key and return org info (for MCP)
 */
router.get("/validate", apiKeyAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const org = await db.query.orgs.findFirst({
      where: eq(orgs.id, req.orgId!),
    });

    if (!org) {
      return res.status(404).json({ error: "Organization not found" });
    }

    // Get configured BYOK keys (just providers, not the actual keys)
    const keys = await db.query.byokKeys.findMany({
      where: eq(byokKeys.orgId, req.orgId!),
    });

    const configuredProviders = keys.map((k) => k.provider);

    res.json({
      valid: true,
      orgId: org.id,
      clerkOrgId: org.clerkOrgId,
      configuredProviders,
    });
  } catch (error) {
    console.error("Validate error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /validate/keys/:provider - Get decrypted BYOK key (for MCP internal use)
 * This should only be called from trusted MCP services
 */
router.get("/validate/keys/:provider", apiKeyAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { provider } = req.params;

    const key = await db.query.byokKeys.findFirst({
      where: and(
        eq(byokKeys.orgId, req.orgId!),
        eq(byokKeys.provider, provider)
      ),
    });

    if (!key) {
      return res.status(404).json({ error: `${provider} key not configured` });
    }

    // Return decrypted key - this is for internal MCP use only
    res.json({
      provider,
      key: decrypt(key.encryptedKey),
    });
  } catch (error) {
    console.error("Get key error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
