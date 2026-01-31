// IMPORTANT: Import instrument first to initialize Sentry before anything else
import "./instrument.js";
import { startCampaignRunWorker } from "./workers/campaign-run.js";
import { startLeadSearchWorker } from "./workers/lead-search.js";
import { startEmailGenerateWorker } from "./workers/email-generate.js";
import { startEmailSendWorker } from "./workers/email-send.js";
import { startCampaignScheduler } from "./schedulers/campaign-scheduler.js";
import { closeRedis } from "./lib/redis.js";

console.log("=== MCP Factory Worker Starting ===");
console.log("Environment check:");
console.log("  REDIS_URL:", process.env.REDIS_URL ? "✓ configured" : "✗ MISSING");
console.log("  CAMPAIGN_SERVICE_URL:", process.env.CAMPAIGN_SERVICE_URL ? "✓ configured" : "✗ MISSING");
console.log("  COMPANY_SERVICE_URL:", process.env.COMPANY_SERVICE_URL ? "✓ configured" : "✗ MISSING");

let schedulerInterval: NodeJS.Timeout;
let workers: ReturnType<typeof startCampaignRunWorker>[] = [];

try {
  // Start the scheduler to poll for ongoing campaigns
  console.log("Starting scheduler...");
  schedulerInterval = startCampaignScheduler(30000); // Every 30 seconds
  console.log("Scheduler started");

  // Start all workers
  console.log("Starting workers...");
  workers = [
    startCampaignRunWorker(),
    startLeadSearchWorker(),
    startEmailGenerateWorker(),
    startEmailSendWorker(),
  ];
  console.log(`=== ${workers.length} workers + scheduler ready ===`);
} catch (error) {
  console.error("=== FATAL: Worker startup failed ===", error);
  process.exit(1);
}

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("Shutting down workers...");
  
  clearInterval(schedulerInterval);
  await Promise.all(workers.map((w) => w.close()));
  await closeRedis();
  
  console.log("Workers shut down");
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("Shutting down workers...");
  
  clearInterval(schedulerInterval);
  await Promise.all(workers.map((w) => w.close()));
  await closeRedis();
  
  console.log("Workers shut down");
  process.exit(0);
});
