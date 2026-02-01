import { Worker, Job } from "bullmq";
import { getRedis } from "../lib/redis.js";
import { getQueues, QUEUE_NAMES, CampaignRunJobData, LeadSearchJobData } from "../queues/index.js";
import { campaignService, companyService } from "../lib/service-client.js";

interface CampaignDetails {
  id: string;
  name: string;
  // Brand info
  brandId?: string;
  brandDomain?: string;
  brandName?: string;
  brandUrl?: string;
  // Apollo targeting criteria
  personTitles?: string[];
  organizationLocations?: string[];
  qOrganizationKeywordTags?: string[];
  organizationNumEmployeesRanges?: string[];
  qOrganizationIndustryTagIds?: string[];
  qKeywords?: string;
  // Legacy: raw request storage (for backwards compat)
  requestRaw?: {
    clientUrl?: string;
    brandUrl?: string;
  };
}

interface SalesProfileResponse {
  cached?: boolean;
  profile?: {
    companyName: string | null;
    valueProposition: string | null;
    companyOverview: string | null;
    targetAudience: string | null;
    customerPainPoints: string[];
    keyFeatures: string[];
    productDifferentiators: string[];
    competitors: string[];
    socialProof: {
      caseStudies: string[];
      testimonials: string[];
      results: string[];
    };
    callToAction: string | null;
    additionalContext: string | null;
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
        
        // 2. Get campaign details including brand info
        const campaignResult = await campaignService.getCampaign(campaignId, clerkOrgId) as { campaign: CampaignDetails };
        const campaign = campaignResult.campaign;
        
        // Get brandUrl from either new brandUrl field or legacy requestRaw
        const brandUrl = campaign.brandUrl || campaign.requestRaw?.brandUrl || campaign.requestRaw?.clientUrl;
        const brandId = campaign.brandId;
        
        console.log(`[campaign-run] Campaign ${campaignId} brandId: ${brandId}, brandUrl: ${brandUrl}`);
        
        // 3. Get client sales profile from company-service
        let clientData: LeadSearchJobData["clientData"] = { companyName: "" };
        if (brandUrl) {
          try {
            console.log(`[campaign-run] Getting sales profile for brand: ${brandId || brandUrl}`);
            
            // Company-service handles fetching the API key internally
            // Pass brandId if available, otherwise fall back to URL
            const profileResult = await companyService.getSalesProfile(
              clerkOrgId, 
              brandUrl, 
              "byok"
            ) as SalesProfileResponse;
            
            if (profileResult?.profile) {
              const p = profileResult.profile;
              clientData = {
                companyName: p.companyName || "",
                companyOverview: p.companyOverview || undefined,
                valueProposition: p.valueProposition || undefined,
                targetAudience: p.targetAudience || undefined,
                customerPainPoints: p.customerPainPoints?.length ? p.customerPainPoints : undefined,
                keyFeatures: p.keyFeatures?.length ? p.keyFeatures : undefined,
                productDifferentiators: p.productDifferentiators?.length ? p.productDifferentiators : undefined,
                competitors: p.competitors?.length ? p.competitors : undefined,
                socialProof: p.socialProof || undefined,
                callToAction: p.callToAction || undefined,
                additionalContext: p.additionalContext || undefined,
              };
              console.log(`[campaign-run] Client company: ${clientData.companyName} (cached: ${profileResult.cached})`);
            }
          } catch (companyError) {
            console.error(`[campaign-run] Failed to get client sales profile:`, companyError);
            // Continue with empty client data rather than failing
          }
        }
        
        // 4. Build search params from campaign targeting criteria
        const searchParams = {
          personTitles: campaign.personTitles,
          organizationLocations: campaign.organizationLocations,
          qOrganizationKeywordTags: campaign.qOrganizationKeywordTags,
          organizationNumEmployeesRanges: campaign.organizationNumEmployeesRanges,
          qOrganizationIndustryTagIds: campaign.qOrganizationIndustryTagIds,
          qKeywords: campaign.qKeywords,
        };
        
        console.log(`[campaign-run] Search params:`, JSON.stringify(searchParams));
        
        // 5. Queue lead search job with client data and search params
        const queues = getQueues();
        await queues[QUEUE_NAMES.LEAD_SEARCH].add(
          `search-${campaignRunId}`,
          {
            campaignRunId,
            clerkOrgId,
            searchParams,
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
