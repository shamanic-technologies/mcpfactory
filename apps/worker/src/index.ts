// IMPORTANT: Import instrument first to initialize Sentry before anything else
import "./instrument.js";
import { startCampaignRunWorker } from "./workers/campaign-run.js";
import { startLeadSearchWorker } from "./workers/lead-search.js";
import { startEmailGenerateWorker } from "./workers/email-generate.js";
import { startEmailSendWorker } from "./workers/email-send.js";
import { startCampaignScheduler } from "./schedulers/campaign-scheduler.js";
import { closeRedis } from "./lib/redis.js";

console.log("Starting MCP Factory Worker...");

// Start the scheduler to poll for ongoing campaigns
const schedulerInterval = startCampaignScheduler(30000); // Every 30 seconds

// Start all workers
const workers = [
  startCampaignRunWorker(),
  startLeadSearchWorker(),
  startEmailGenerateWorker(),
  startEmailSendWorker(),
];

console.log(`Started ${workers.length} workers + scheduler`);

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
