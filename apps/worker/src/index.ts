import * as Sentry from "@sentry/node";
import { startCampaignRunWorker } from "./workers/campaign-run.js";
import { startLeadSearchWorker } from "./workers/lead-search.js";
import { startEmailGenerateWorker } from "./workers/email-generate.js";
import { startEmailSendWorker } from "./workers/email-send.js";
import { closeRedis } from "./lib/redis.js";

// Initialize Sentry
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || "development",
    tracesSampleRate: 0.1,
  });
  Sentry.setTag("service", "worker");
}

console.log("Starting MCP Factory Worker...");

// Start all workers
const workers = [
  startCampaignRunWorker(),
  startLeadSearchWorker(),
  startEmailGenerateWorker(),
  startEmailSendWorker(),
];

console.log(`Started ${workers.length} workers`);

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("Shutting down workers...");
  
  await Promise.all(workers.map((w) => w.close()));
  await closeRedis();
  
  console.log("Workers shut down");
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("Shutting down workers...");
  
  await Promise.all(workers.map((w) => w.close()));
  await closeRedis();
  
  console.log("Workers shut down");
  process.exit(0);
});
