import { Router } from "express";
import { callExternalService, externalServices } from "../lib/service-client.js";

const router = Router();

// Public route — no auth required
router.get("/performance/leaderboard", async (req, res) => {
  // #swagger.tags = ['Performance']
  // #swagger.summary = 'Get performance leaderboard'
  // #swagger.description = 'Returns public performance leaderboard data. No authentication required.'
  try {
    const data = await callExternalService(
      externalServices.campaign,
      "/internal/performance/leaderboard"
    );
    res.json(data);
  } catch (error) {
    console.error("Performance leaderboard proxy error:", error);
    res.status(502).json({ error: "Failed to fetch leaderboard data" });
  }
});

export default router;
