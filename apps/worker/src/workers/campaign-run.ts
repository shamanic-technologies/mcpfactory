import { Worker, Job } from "bullmq";
import { getRedis } from "../lib/redis.js";
import { getQueues, QUEUE_NAMES, CampaignRunJobData, LeadSearchJobData } from "../queues/index.js";
import { campaignService, companyService } from "../lib/service-client.js";

interface CampaignDetails {
  id: string;
  name: string;
  requestRaw?: {
    clientUrl?: string;
  };
}

interface CompanyScrapeResult {
  companyName?: string;
  companyDescription?: string;
  name?: string;
  description?: string;
}

/**
 * Campaign Run Worker
 * 
 * This is the main orchestrator that:
 * 1. Creates a campaign run record
 * 2. Fetches campaign details including clientUrl
 * 3. Scrapes client company info
 * 4. Queues lead search jobs with client data
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
        
        // 2. Get campaign details to find clientUrl
        const campaignResult = await campaignService.getCampaign(campaignId, clerkOrgId) as { campaign: CampaignDetails };
        const campaign = campaignResult.campaign;
        const clientUrl = campaign.requestRaw?.clientUrl;
        
        console.log(`[campaign-run] Campaign ${campaignId} clientUrl: ${clientUrl}`);
        
        // 3. Scrape client company info if URL provided
        let clientData = { companyName: "", companyDescription: "" };
        if (clientUrl) {
          try {
            console.log(`[campaign-run] Scraping client company: ${clientUrl}`);
            const scrapeResult = await companyService.scrape(clerkOrgId, clientUrl) as CompanyScrapeResult;
            clientData = {
              companyName: scrapeResult.companyName || scrapeResult.name || "",
              companyDescription: scrapeResult.companyDescription || scrapeResult.description || "",
            };
            console.log(`[campaign-run] Client company: ${clientData.companyName}`);
          } catch (scrapeError) {
            console.error(`[campaign-run] Failed to scrape client company:`, scrapeError);
            // Continue with empty client data rather than failing
          }
        }
        
        // 4. Queue lead search job with client data
        const queues = getQueues();
        await queues[QUEUE_NAMES.LEAD_SEARCH].add(
          `search-${campaignRunId}`,
          {
            campaignRunId,
            clerkOrgId,
            searchParams: {},
            clientData,
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
