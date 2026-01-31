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

interface SalesProfileResponse {
  cached?: boolean;
  profile?: {
    companyName: string | null;
    valueProposition: string | null;
    companyOverview: string | null;
  };
}

/**
 * Campaign Run Worker
 * 
 * This is the main orchestrator that:
 * 1. Creates a campaign run record
 * 2. Fetches campaign details including clientUrl
 * 3. Gets client company info from company-service (already scraped at campaign creation)
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
        
        // 3. Get client sales profile from company-service
        let clientData = { companyName: "", companyDescription: "" };
        if (clientUrl) {
          try {
            console.log(`[campaign-run] Getting sales profile for: ${clientUrl}`);
            
            // Company-service handles fetching the API key internally
            const profileResult = await companyService.getSalesProfile(
              clerkOrgId, 
              clientUrl, 
              "byok"  // Use user's own Anthropic key
            ) as SalesProfileResponse;
            
            if (profileResult?.profile) {
              clientData = {
                companyName: profileResult.profile.companyName || "",
                companyDescription: profileResult.profile.valueProposition || profileResult.profile.companyOverview || "",
              };
              console.log(`[campaign-run] Client company: ${clientData.companyName} (cached: ${profileResult.cached})`);
            }
          } catch (companyError) {
            console.error(`[campaign-run] Failed to get client sales profile:`, companyError);
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
