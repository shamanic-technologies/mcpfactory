import { Router } from "express";
import { eq, and } from "drizzle-orm";
import { db } from "../db/index.js";
import { byokKeys, orgs } from "../db/schema.js";
import { clerkAuth, requireOrg, AuthenticatedRequest } from "../middleware/auth.js";
import { encrypt, decrypt, maskKey } from "../lib/crypto.js";

const router = Router();

const VALID_PROVIDERS = ["apollo", "anthropic"];

/**
 * GET /byok - List all BYOK keys (masked) for org
 */
router.get("/byok", clerkAuth, requireOrg, async (req: AuthenticatedRequest, res) => {
  try {
    const keys = await db.query.byokKeys.findMany({
      where: eq(byokKeys.orgId, req.orgId!),
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
 * PUT /byok/:provider - Set or update a BYOK key
 */
router.put("/byok/:provider", clerkAuth, requireOrg, async (req: AuthenticatedRequest, res) => {
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
        eq(byokKeys.orgId, req.orgId!),
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
        orgId: req.orgId!,
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
 * DELETE /byok/:provider - Delete a BYOK key
 */
router.delete("/byok/:provider", clerkAuth, requireOrg, async (req: AuthenticatedRequest, res) => {
  try {
    const { provider } = req.params;

    if (!VALID_PROVIDERS.includes(provider)) {
      return res.status(400).json({ error: "Invalid provider" });
    }

    await db
      .delete(byokKeys)
      .where(
        and(eq(byokKeys.orgId, req.orgId!), eq(byokKeys.provider, provider))
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

/**
 * GET /byok/:provider/decrypt - Get decrypted key (internal use only)
 * Protected endpoint for other services via service-to-service auth
 */
router.get("/byok/:provider/decrypt", async (req, res) => {
  try {
    const { provider } = req.params;
    const { clerkOrgId } = req.query;
    const serviceKey = req.headers["x-service-key"];

    // Service-to-service auth
    if (serviceKey !== process.env.SERVICE_SECRET_KEY) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!clerkOrgId || typeof clerkOrgId !== "string") {
      return res.status(400).json({ error: "clerkOrgId required" });
    }

    // Find org by clerk ID
    const org = await db.query.orgs.findFirst({
      where: eq(orgs.clerkOrgId, clerkOrgId),
    });

    if (!org) {
      return res.status(404).json({ error: "Org not found" });
    }

    // Find the BYOK key
    const key = await db.query.byokKeys.findFirst({
      where: and(
        eq(byokKeys.orgId, org.id),
        eq(byokKeys.provider, provider)
      ),
    });

    if (!key) {
      return res.status(404).json({ error: "Key not found" });
    }

    res.json({
      provider,
      key: decrypt(key.encryptedKey),
    });
  } catch (error) {
    console.error("Decrypt key error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
