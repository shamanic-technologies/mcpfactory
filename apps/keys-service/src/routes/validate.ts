import { Router } from "express";
import { eq, and } from "drizzle-orm";
import { createClerkClient } from "@clerk/backend";
import { db } from "../db/index.js";
import { orgs, byokKeys } from "../db/schema.js";
import { apiKeyAuth, AuthenticatedRequest } from "../middleware/auth.js";
import { decrypt } from "../lib/crypto.js";

const router = Router();

// Lazy init Clerk client
let clerkClient: ReturnType<typeof createClerkClient> | null = null;
function getClerkClient() {
  if (!clerkClient) {
    clerkClient = createClerkClient({
      secretKey: process.env.CLERK_SECRET_KEY!,
    });
  }
  return clerkClient;
}

/**
 * Get the single user's clerkUserId if org has exactly 1 member, otherwise null
 */
async function getSingleUserIdForOrg(clerkOrgId: string): Promise<string | null> {
  try {
    const clerk = getClerkClient();
    const memberships = await clerk.organizations.getOrganizationMembershipList({
      organizationId: clerkOrgId,
      limit: 2, // We only need to know if there's 1 or more
    });

    if (memberships.data.length === 1) {
      return memberships.data[0].publicUserData?.userId || null;
    }
    return null;
  } catch (error) {
    console.error("Error fetching org members from Clerk:", error);
    return null;
  }
}

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

    // Get userId if org has single member
    const clerkUserId = await getSingleUserIdForOrg(org.clerkOrgId);

    res.json({
      valid: true,
      orgId: org.id,
      clerkOrgId: org.clerkOrgId,
      clerkUserId, // null if org has 0 or >1 members
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
