import { Worker, Job } from "bullmq";
import { getRedis } from "../lib/redis.js";
import { getQueues, QUEUE_NAMES, CampaignRunJobData, LeadSearchJobData } from "../queues/index.js";
import { campaignService, apolloService } from "../lib/service-client.js";

/**
 * Campaign Run Worker
 * 
 * This is the main orchestrator that:
 * 1. Creates a campaign run record
 * 2. Fetches campaign targeting criteria
 * 3. Queues lead search jobs
 */
export function startCampaignRunWorker(): Worker {
  const connection = getRedis();
  
  const worker = new Worker<CampaignRunJobData>(
    QUEUE_NAMES.CAMPAIGN_RUN,
    async (job: Job<CampaignRunJobData>) => {
      const { campaignId, clerkOrgId } = job.data;
      
      console.log(`[campaign-run] Starting campaign ${campaignId}`);
      
      try {
        // 1. Create a campaign run
        const runResult = await campaignService.createRun(campaignId, clerkOrgId) as { run: { id: string } };
        const campaignRunId = runResult.run.id;
        
        // 2. Get campaign details (we'd need to add this endpoint)
        // For now, we'll use the job data or fetch from the campaign
        
        // 3. Queue lead search job
        const queues = getQueues();
        await queues[QUEUE_NAMES.LEAD_SEARCH].add(
          `search-${campaignRunId}`,
          {
            campaignRunId,
            clerkOrgId,
            searchParams: {}, // Would be populated from campaign
          } as LeadSearchJobData
        );
        
        console.log(`[campaign-run] Queued lead search for run ${campaignRunId}`);
        
        return { campaignRunId };
      } catch (error) {
        console.error(`[campaign-run] Error:`, error);
        throw error;
      }
    },
    {
      connection,
      concurrency: 5,
    }
  );
  
  worker.on("ready", () => {
    console.log(`[campaign-run] Worker ready and listening for jobs`);
  });
  
  worker.on("completed", (job) => {
    console.log(`[campaign-run] Job ${job.id} completed`);
  });
  
  worker.on("failed", (job, err) => {
    console.error(`[campaign-run] Job ${job?.id} failed:`, err);
  });
  
  console.log(`[campaign-run] Worker started on queue: ${QUEUE_NAMES.CAMPAIGN_RUN}`);
  
  return worker;
}
