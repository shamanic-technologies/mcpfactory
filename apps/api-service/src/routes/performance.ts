import { Router } from "express";
import { callService, services } from "../lib/service-client.js";

const router = Router();

// Public route — no auth required
router.get("/performance/leaderboard", async (req, res) => {
  try {
    const data = await callService(
      services.campaign,
      "/internal/performance/leaderboard"
    );
    res.json(data);
  } catch (error) {
    console.error("Performance leaderboard proxy error:", error);
    res.status(502).json({ error: "Failed to fetch leaderboard data" });
  }
});

export default router;
