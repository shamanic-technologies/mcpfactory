import { Router } from "express";
import { eq, and } from "drizzle-orm";
import { db } from "../db/index.js";
import { byokKeys } from "../db/schema.js";
import { clerkAuth, AuthenticatedRequest } from "../middleware/auth.js";
import { encrypt, decrypt, maskKey } from "../lib/crypto.js";

const router = Router();

const VALID_PROVIDERS = ["openai", "anthropic", "apollo", "resend", "hunter"];

/**
 * GET /keys - List all BYOK keys (masked)
 */
router.get("/keys", clerkAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const keys = await db.query.byokKeys.findMany({
      where: eq(byokKeys.userId, req.userId!),
    });

    const maskedKeys = keys.map((key) => ({
      provider: key.provider,
      maskedKey: maskKey(decrypt(key.encryptedKey)),
      createdAt: key.createdAt,
      updatedAt: key.updatedAt,
    }));

    res.json({ keys: maskedKeys });
  } catch (error) {
    console.error("List keys error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * PUT /keys/:provider - Set or update a BYOK key
 */
router.put("/keys/:provider", clerkAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { provider } = req.params;
    const { key } = req.body;

    if (!VALID_PROVIDERS.includes(provider)) {
      return res.status(400).json({
        error: `Invalid provider. Valid providers: ${VALID_PROVIDERS.join(", ")}`,
      });
    }

    if (!key || typeof key !== "string" || key.length < 10) {
      return res.status(400).json({ error: "Invalid key" });
    }

    const encryptedKey = encrypt(key);

    // Upsert: insert or update
    const existing = await db.query.byokKeys.findFirst({
      where: and(
        eq(byokKeys.userId, req.userId!),
        eq(byokKeys.provider, provider)
      ),
    });

    if (existing) {
      await db
        .update(byokKeys)
        .set({
          encryptedKey,
          updatedAt: new Date(),
        })
        .where(eq(byokKeys.id, existing.id));
    } else {
      await db.insert(byokKeys).values({
        userId: req.userId!,
        provider,
        encryptedKey,
      });
    }

    res.json({
      provider,
      maskedKey: maskKey(key),
      message: `${provider} key saved successfully`,
    });
  } catch (error) {
    console.error("Set key error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * DELETE /keys/:provider - Delete a BYOK key
 */
router.delete("/keys/:provider", clerkAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { provider } = req.params;

    if (!VALID_PROVIDERS.includes(provider)) {
      return res.status(400).json({ error: "Invalid provider" });
    }

    await db
      .delete(byokKeys)
      .where(
        and(eq(byokKeys.userId, req.userId!), eq(byokKeys.provider, provider))
      );

    res.json({
      provider,
      message: `${provider} key deleted successfully`,
    });
  } catch (error) {
    console.error("Delete key error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
