import { Router } from "express";
import { db } from "../db/index.js";
import { users } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth.js";

const router = Router();

// Get or create user from Clerk ID
router.post("/users/sync", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const clerkUserId = req.userId!;

    // Check if user exists
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.clerkUserId, clerkUserId))
      .limit(1);

    if (existing.length > 0) {
      return res.json({ user: existing[0], created: false });
    }

    // Create new user
    const [newUser] = await db
      .insert(users)
      .values({ clerkUserId })
      .returning();

    return res.json({ user: newUser, created: true });
  } catch (error) {
    console.error("User sync error:", error);
    return res.status(500).json({ error: "Failed to sync user" });
  }
});

// Get user by Clerk ID
router.get("/users/me", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const clerkUserId = req.userId!;

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.clerkUserId, clerkUserId))
      .limit(1);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json({ user });
  } catch (error) {
    console.error("Get user error:", error);
    return res.status(500).json({ error: "Failed to get user" });
  }
});

// Get internal user ID from Clerk ID (for other services)
router.get("/users/by-clerk/:clerkUserId", async (req, res) => {
  try {
    const { clerkUserId } = req.params;

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.clerkUserId, clerkUserId))
      .limit(1);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json({ user });
  } catch (error) {
    console.error("Get user by clerk error:", error);
    return res.status(500).json({ error: "Failed to get user" });
  }
});

export default router;
