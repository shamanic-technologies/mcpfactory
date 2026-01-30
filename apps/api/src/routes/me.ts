import { Router } from "express";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { users } from "../db/schema.js";
import { clerkAuth, AuthenticatedRequest } from "../middleware/auth.js";
import { generateApiKey } from "../lib/api-key.js";

const router = Router();

/**
 * GET /me - Get current user profile
 */
router.get("/me", clerkAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, req.userId!),
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      id: user.id,
      clerkUserId: user.clerkUserId,
      apiKey: user.apiKey,
      plan: user.plan,
      createdAt: user.createdAt,
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /me/regenerate-key - Regenerate API key
 */
router.post("/me/regenerate-key", clerkAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const newApiKey = generateApiKey();

    const [updatedUser] = await db
      .update(users)
      .set({
        apiKey: newApiKey,
        updatedAt: new Date(),
      })
      .where(eq(users.id, req.userId!))
      .returning();

    res.json({
      apiKey: updatedUser.apiKey,
      message: "API key regenerated successfully",
    });
  } catch (error) {
    console.error("Regenerate key error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
