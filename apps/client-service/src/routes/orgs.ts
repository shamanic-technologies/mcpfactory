import { Router } from "express";
import { db } from "../db/index.js";
import { orgs } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth.js";

const router = Router();

// Get or create org from Clerk Org ID
router.post("/orgs/sync", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const clerkOrgId = req.orgId;

    if (!clerkOrgId) {
      return res.status(400).json({ error: "No organization context" });
    }

    // Check if org exists
    const existing = await db
      .select()
      .from(orgs)
      .where(eq(orgs.clerkOrgId, clerkOrgId))
      .limit(1);

    if (existing.length > 0) {
      return res.json({ org: existing[0], created: false });
    }

    // Create new org
    const [newOrg] = await db
      .insert(orgs)
      .values({ clerkOrgId })
      .returning();

    return res.json({ org: newOrg, created: true });
  } catch (error) {
    console.error("Org sync error:", error);
    return res.status(500).json({ error: "Failed to sync org" });
  }
});

// Get org by Clerk Org ID
router.get("/orgs/me", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const clerkOrgId = req.orgId;

    if (!clerkOrgId) {
      return res.status(400).json({ error: "No organization context" });
    }

    const [org] = await db
      .select()
      .from(orgs)
      .where(eq(orgs.clerkOrgId, clerkOrgId))
      .limit(1);

    if (!org) {
      return res.status(404).json({ error: "Org not found" });
    }

    return res.json({ org });
  } catch (error) {
    console.error("Get org error:", error);
    return res.status(500).json({ error: "Failed to get org" });
  }
});

// Get internal org ID from Clerk Org ID (for other services)
router.get("/orgs/by-clerk/:clerkOrgId", async (req, res) => {
  try {
    const { clerkOrgId } = req.params;

    const [org] = await db
      .select()
      .from(orgs)
      .where(eq(orgs.clerkOrgId, clerkOrgId))
      .limit(1);

    if (!org) {
      return res.status(404).json({ error: "Org not found" });
    }

    return res.json({ org });
  } catch (error) {
    console.error("Get org by clerk error:", error);
    return res.status(500).json({ error: "Failed to get org" });
  }
});

export default router;
