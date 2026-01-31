import { Router } from "express";
import { db } from "../db/index.js";
import { sql } from "drizzle-orm";

const router = Router();

router.get("/health", (req, res) => {
  res.json({ status: "ok", service: "apollo-service" });
});

router.get("/health/debug", async (req, res) => {
  const keysServiceUrl = process.env.KEYS_SERVICE_URL || "not set";
  const dbUrl = process.env.APOLLO_SERVICE_DATABASE_URL;
  
  let dbStatus = "unknown";
  try {
    await db.execute(sql`SELECT 1`);
    dbStatus = "connected";
  } catch (e: any) {
    dbStatus = `error: ${e.message}`;
  }

  let keysServiceStatus = "unknown";
  try {
    const resp = await fetch(`${keysServiceUrl}/health`);
    keysServiceStatus = resp.ok ? "connected" : `status: ${resp.status}`;
  } catch (e: any) {
    keysServiceStatus = `error: ${e.message}`;
  }

  res.json({
    keysServiceUrl,
    dbConfigured: !!dbUrl,
    dbStatus,
    keysServiceStatus,
  });
});

export default router;
