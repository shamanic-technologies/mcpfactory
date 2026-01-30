import { Router } from "express";
import { clerkAuth, AuthenticatedRequest } from "../middleware/auth.js";

const router = Router();

/**
 * GET /me - Get current auth context
 */
router.get("/me", clerkAuth, async (req: AuthenticatedRequest, res) => {
  try {
    res.json({
      userId: req.userId,
      orgId: req.orgId,
      clerkUserId: req.clerkUserId,
      clerkOrgId: req.clerkOrgId,
    });
  } catch (error) {
    console.error("Get me error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
