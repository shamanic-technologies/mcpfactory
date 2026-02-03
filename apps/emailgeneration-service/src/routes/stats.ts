import { Router } from "express";
import { db } from "../db/index.js";
import { emailGenerations } from "../db/schema.js";
import { inArray, sql } from "drizzle-orm";

const router = Router();

/**
 * POST /stats/by-model - Get email generation stats grouped by model
 * No auth — internal network trust (used by campaign-service leaderboard)
 * Body: { runIds: string[] }
 */
router.post("/stats/by-model", async (req, res) => {
  try {
    const { runIds } = req.body as { runIds: string[] };

    if (!runIds || !Array.isArray(runIds)) {
      return res.status(400).json({ error: "runIds array required" });
    }

    if (runIds.length === 0) {
      return res.json({ stats: [] });
    }

    // Group email generations by model, counting and collecting runIds
    const results = await db
      .select({
        model: emailGenerations.model,
        count: sql<number>`count(*)::int`,
        runIds: sql<string[]>`array_agg(distinct ${emailGenerations.runId})`,
      })
      .from(emailGenerations)
      .where(inArray(emailGenerations.runId, runIds))
      .groupBy(emailGenerations.model);

    res.json({
      stats: results.map((r) => ({
        model: r.model,
        count: r.count,
        runIds: r.runIds,
      })),
    });
  } catch (error) {
    console.error("Get stats by model error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
