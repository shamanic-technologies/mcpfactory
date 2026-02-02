import { getRedis } from "./redis.js";
import { runsService } from "./service-client.js";

const RUN_PREFIX = "run:";
const TOTAL_KEY = ":total";
const DONE_KEY = ":done";
const FAILED_KEY = ":failed";
const TTL_SECONDS = 86400; // 24 hours

/**
 * Track job completion for a campaign run
 * Uses Redis atomic counters to know when all jobs are done
 */

/**
 * Initialize tracking for a run with N expected jobs
 */
export async function initRunTracking(runId: string, totalJobs: number): Promise<void> {
  const redis = getRedis();
  const prefix = `${RUN_PREFIX}${runId}`;
  
  await redis.set(`${prefix}${TOTAL_KEY}`, totalJobs, "EX", TTL_SECONDS);
  await redis.set(`${prefix}${DONE_KEY}`, 0, "EX", TTL_SECONDS);
  await redis.set(`${prefix}${FAILED_KEY}`, 0, "EX", TTL_SECONDS);
  
  console.log(`[run-tracker] Initialized run ${runId} with ${totalJobs} expected jobs`);
}

/**
 * Mark a job as completed (success or failure)
 * Returns true if this was the last job
 */
export async function markJobDone(
  runId: string, 
  success: boolean
): Promise<{ isLast: boolean; total: number; done: number; failed: number }> {
  const redis = getRedis();
  const prefix = `${RUN_PREFIX}${runId}`;
  
  // Atomically increment counters
  const done = await redis.incr(`${prefix}${DONE_KEY}`);
  if (!success) {
    await redis.incr(`${prefix}${FAILED_KEY}`);
  }
  
  const total = parseInt(await redis.get(`${prefix}${TOTAL_KEY}`) || "0", 10);
  const failed = parseInt(await redis.get(`${prefix}${FAILED_KEY}`) || "0", 10);
  
  const isLast = done >= total && total > 0;
  
  console.log(`[run-tracker] Run ${runId}: ${done}/${total} done (${failed} failed), isLast=${isLast}`);
  
  return { isLast, total, done, failed };
}

/**
 * Finalize a run - update status in runs-service
 */
export async function finalizeRun(
  runId: string, 
  stats: { total: number; done: number; failed: number }
): Promise<void> {
  const redis = getRedis();
  const prefix = `${RUN_PREFIX}${runId}`;
  
  // Determine final status
  const status = stats.failed === stats.total ? "failed" : "completed";
  
  console.log(`[run-tracker] Finalizing run ${runId} with status=${status} (${stats.done - stats.failed} success, ${stats.failed} failed)`);
  
  try {
    await runsService.updateRun(runId, status);
    
    // Cleanup Redis keys
    await redis.del(`${prefix}${TOTAL_KEY}`);
    await redis.del(`${prefix}${DONE_KEY}`);
    await redis.del(`${prefix}${FAILED_KEY}`);
    
    console.log(`[run-tracker] Run ${runId} finalized successfully`);
  } catch (error) {
    console.error(`[run-tracker] Failed to finalize run ${runId}:`, error);
  }
}
