import { Router } from "express";
import { db, sql } from "../db/index.js";

const router = Router();

router.get("/health", (req, res) => {
  res.json({ status: "ok", service: "campaign-service" });
});

router.get("/health/debug", async (req, res) => {
  const dbUrl = process.env.CAMPAIGN_SERVICE_DATABASE_URL;
  let dbStatus = "unknown";
  try {
    await sql`SELECT 1`;
    dbStatus = "connected";
  } catch (e: any) {
    dbStatus = `error: ${e.message}`;
  }
  res.json({
    dbUrlConfigured: !!dbUrl,
    dbStatus,
  });
});

export default router;
