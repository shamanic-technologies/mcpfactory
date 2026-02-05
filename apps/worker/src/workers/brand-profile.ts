import { Worker, Job } from "bullmq";
import { getRedis } from "../lib/redis.js";
import { getQueues, QUEUE_NAMES, BrandProfileJobData, LeadSearchJobData } from "../queues/index.js";
import { brandService, campaignService } from "../lib/service-client.js";

interface SalesProfileResponse {
  cached?: boolean;
  brandId?: string;  // Brand ID from brand-service
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
 * Brand Profile Worker (concurrency=N)
 * 
 * Second step in campaign run chain:
 * 1. Fetches sales profile from brand-service (cached or scraped)
 * 2. Queues lead-search job with clientData
 * 
 * Can be concurrent since brand-service handles caching/locking
 */
export function startBrandProfileWorker(): Worker {
  const connection = getRedis();
  
  const worker = new Worker<BrandProfileJobData>(
    QUEUE_NAMES.BRAND_PROFILE,
    async (job: Job<BrandProfileJobData>) => {
      const { campaignId, runId, clerkOrgId, brandUrl, searchParams } = job.data;
      
      // Extract domain from brandUrl for logging and fallback
      const brandDomain = new URL(brandUrl).hostname.replace(/^www\./, '');
      console.log(`[brand-profile] Fetching profile for ${brandDomain} (${brandUrl})`);
      
      try {
        // 1. Get sales profile from brand-service
        // brand-service will create the brand if it doesn't exist (getOrCreateBrand)
        let clientData: LeadSearchJobData["clientData"] = { companyName: brandDomain, brandUrl };
        let brandId = "";

        try {
          const profileResult = await brandService.getSalesProfile(
            clerkOrgId,
            brandUrl,
            "byok"
          ) as SalesProfileResponse;
          
          if (profileResult?.profile) {
            const p = profileResult.profile;
            clientData = {
              companyName: p.companyName || brandDomain,
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
            clientData.brandUrl = brandUrl;
            console.log(`[brand-profile] Got profile: ${clientData.companyName} (cached: ${profileResult.cached})`);

            // Update campaign with brandId from brand-service
            if (profileResult.brandId) {
              brandId = profileResult.brandId;
              try {
                await campaignService.updateCampaign(campaignId, clerkOrgId, {
                  brandId,
                });
                console.log(`[brand-profile] Updated campaign ${campaignId} with brandId: ${brandId}`);
              } catch (updateErr) {
                // Non-fatal - log and continue
                console.error(`[brand-profile] Failed to update campaign brandId:`, updateErr);
              }
            }
          }
        } catch (profileError) {
          console.error(`[brand-profile] Failed to get profile:`, profileError);
          // Continue with domain as company name rather than failing
          console.log(`[brand-profile] Using domain as fallback: ${brandDomain}`);
        }
        
        // 2. Queue lead-search job
        const queues = getQueues();
        await queues[QUEUE_NAMES.LEAD_SEARCH].add(
          `search-${runId}`,
          {
            runId,
            clerkOrgId,
            campaignId,
            brandId,
            searchParams,
            clientData,
          } as LeadSearchJobData
        );
        
        console.log(`[brand-profile] Queued lead-search for run ${runId}`);
        console.log(`[brand-profile] Search params:`, JSON.stringify(searchParams));
        
        return { runId, brandUrl, hasProfile: !!clientData.companyName };
      } catch (error) {
        console.error(`[brand-profile] Error:`, error);
        throw error;
      }
    },
    {
      connection,
      concurrency: 5, // Can be concurrent
    }
  );
  
  worker.on("ready", () => {
    console.log(`[brand-profile] Worker ready (concurrency=5)`);
  });
  
  worker.on("completed", (job) => {
    console.log(`[brand-profile] Job ${job.id} completed`);
  });
  
  worker.on("failed", (job, err) => {
    console.error(`[brand-profile] Job ${job?.id} failed:`, err);
  });
  
  console.log(`[brand-profile] Worker started on queue: ${QUEUE_NAMES.BRAND_PROFILE}`);
  
  return worker;
}
