import { Router } from "express";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { apiKeys } from "../db/schema.js";
import { clerkAuth, requireOrg, AuthenticatedRequest } from "../middleware/auth.js";
import { generateApiKey, hashApiKey, getKeyPrefix } from "../lib/api-key.js";

const router = Router();

/**
 * GET /api-keys - List all API keys for org
 */
router.get("/api-keys", clerkAuth, requireOrg, async (req: AuthenticatedRequest, res) => {
  try {
    const keys = await db.query.apiKeys.findMany({
      where: eq(apiKeys.orgId, req.orgId!),
    });

    res.json({
      keys: keys.map((k) => ({
        id: k.id,
        keyPrefix: k.keyPrefix,
        name: k.name,
        createdAt: k.createdAt,
        lastUsedAt: k.lastUsedAt,
      })),
    });
  } catch (error) {
    console.error("List API keys error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /api-keys - Generate a new API key
 */
router.post("/api-keys", clerkAuth, requireOrg, async (req: AuthenticatedRequest, res) => {
  try {
    const { name } = req.body;

    const rawKey = generateApiKey();
    const keyHash = hashApiKey(rawKey);
    const keyPrefix = getKeyPrefix(rawKey);

    const [apiKey] = await db
      .insert(apiKeys)
      .values({
        orgId: req.orgId!,
        keyHash,
        keyPrefix,
        name: name || null,
      })
      .returning();

    // Return the raw key ONCE (we don't store it)
    res.json({
      id: apiKey.id,
      key: rawKey, // Only returned on creation
      keyPrefix: apiKey.keyPrefix,
      name: apiKey.name,
      message: "API key created. Save this key - it won't be shown again.",
    });
  } catch (error) {
    console.error("Create API key error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * DELETE /api-keys/:id - Delete an API key
 */
router.delete("/api-keys/:id", clerkAuth, requireOrg, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    const result = await db
      .delete(apiKeys)
      .where(eq(apiKeys.id, id))
      .returning();

    if (result.length === 0) {
      return res.status(404).json({ error: "API key not found" });
    }

    res.json({ message: "API key deleted successfully" });
  } catch (error) {
    console.error("Delete API key error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
