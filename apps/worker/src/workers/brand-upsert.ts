import { Worker, Job } from "bullmq";
import { getRedis } from "../lib/redis.js";
import { getQueues, QUEUE_NAMES, BrandUpsertJobData, BrandProfileJobData } from "../queues/index.js";
import { campaignService } from "../lib/service-client.js";

interface CampaignDetails {
  id: string;
  name: string;
  brandId?: string;  // Set by brand-profile worker after brand creation
  brandDomain?: string;
  brandName?: string;
  brandUrl?: string;
  personTitles?: string[];
  organizationLocations?: string[];
  qOrganizationKeywordTags?: string[];
  organizationNumEmployeesRanges?: string[];
  qOrganizationIndustryTagIds?: string[];
  qKeywords?: string;
  requestRaw?: {
    brandUrl?: string;
  };
}

/**
 * Brand Upsert Worker (concurrency=1)
 * 
 * First step in campaign run chain:
 * 1. Creates a campaign_run record
 * 2. Gets campaign details with brandUrl
 * 3. Queues brand-profile job (brand-service will create brand if needed)
 * 
 * Non-concurrent to avoid race conditions
 */
export function startBrandUpsertWorker(): Worker {
  const connection = getRedis();
  
  const worker = new Worker<BrandUpsertJobData>(
    QUEUE_NAMES.BRAND_UPSERT,
    async (job: Job<BrandUpsertJobData>) => {
      const { campaignId, clerkOrgId } = job.data;
      
      console.log(`[brand-upsert] Starting for campaign ${campaignId}`);
      
      try {
        // 1. Create a campaign run record
        const runResult = await campaignService.createRun(campaignId, clerkOrgId) as { run: { id: string } };
        const campaignRunId = runResult.run.id;
        console.log(`[brand-upsert] Created run ${campaignRunId}`);
        
        // 2. Get campaign details including brandUrl
        const campaignResult = await campaignService.getCampaign(campaignId, clerkOrgId) as { campaign: CampaignDetails };
        const campaign = campaignResult.campaign;
        
        // Get brandUrl - this is now the source of truth
        // Fall back to requestRaw.brandUrl for backwards compatibility
        const brandUrl = campaign.brandUrl || campaign.requestRaw?.brandUrl;
        
        if (!brandUrl) {
          throw new Error(`Campaign ${campaignId} has no brandUrl`);
        }
        
        // Extract domain for logging
        const brandDomain = new URL(brandUrl).hostname.replace(/^www\./, '');
        console.log(`[brand-upsert] Brand: ${brandDomain} (${brandUrl})`);
        
        // 3. Build search params
        const searchParams = {
          personTitles: campaign.personTitles,
          organizationLocations: campaign.organizationLocations,
          qOrganizationKeywordTags: campaign.qOrganizationKeywordTags,
          organizationNumEmployeesRanges: campaign.organizationNumEmployeesRanges,
          qOrganizationIndustryTagIds: campaign.qOrganizationIndustryTagIds,
          qKeywords: campaign.qKeywords,
        };
        
        // 4. Queue brand-profile job
        // brand-service will upsert the brand when fetching/creating sales profile
        const queues = getQueues();
        await queues[QUEUE_NAMES.BRAND_PROFILE].add(
          `profile-${campaignRunId}`,
          {
            campaignId,
            campaignRunId,
            clerkOrgId,
            brandUrl,  // No brandId needed - brand-service uses clerkOrgId + brandUrl
            searchParams,
          } as BrandProfileJobData
        );
        
        console.log(`[brand-upsert] Queued brand-profile for run ${campaignRunId}`);
        
        return { campaignRunId, brandUrl };
      } catch (error) {
        console.error(`[brand-upsert] Error:`, error);
        throw error;
      }
    },
    {
      connection,
      concurrency: 1, // Non-concurrent to avoid race conditions
    }
  );
  
  worker.on("ready", () => {
    console.log(`[brand-upsert] Worker ready (concurrency=1)`);
  });
  
  worker.on("completed", (job) => {
    console.log(`[brand-upsert] Job ${job.id} completed`);
  });
  
  worker.on("failed", (job, err) => {
    console.error(`[brand-upsert] Job ${job?.id} failed:`, err);
  });
  
  console.log(`[brand-upsert] Worker started on queue: ${QUEUE_NAMES.BRAND_UPSERT}`);
  
  return worker;
}
