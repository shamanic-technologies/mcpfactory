import { Worker, Job } from "bullmq";
import { getRedis } from "../lib/redis.js";
import { getQueues, QUEUE_NAMES, LeadSearchJobData, EmailGenerateJobData } from "../queues/index.js";
import { apolloService } from "../lib/service-client.js";
import { initRunTracking, finalizeRun } from "../lib/run-tracker.js";

interface ApolloEnrichment {
  id: string;
  firstName: string;
  lastName: string;
  title: string;
  email: string;
  organizationName: string;
  organizationIndustry: string;
}

/**
 * Lead Search Worker
 * 
 * Searches Apollo for leads matching campaign criteria
 * Then queues email generation jobs for each lead
 */
export function startLeadSearchWorker(): Worker {
  const connection = getRedis();
  
  const worker = new Worker<LeadSearchJobData>(
    QUEUE_NAMES.LEAD_SEARCH,
    async (job: Job<LeadSearchJobData>) => {
      const { campaignRunId, clerkOrgId, searchParams, clientData } = job.data;
      
      console.log(`[lead-search] Searching leads for run ${campaignRunId}`);
      console.log(`[lead-search] Client: ${clientData?.companyName || "(no client data)"}`);
      
      try {
        // Call Apollo service to search
        const result = await apolloService.search(clerkOrgId, {
          campaignRunId,
          ...searchParams,
        }) as { people: ApolloEnrichment[] };
        
        console.log(`[lead-search] Found ${result.people?.length || 0} leads`);
        
        // Queue email generation for each lead
        const queues = getQueues();
        const jobs = (result.people || []).map((enrichment: ApolloEnrichment) => ({
          name: `generate-${enrichment.id}`,
          data: {
            campaignRunId,
            clerkOrgId,
            apolloEnrichmentId: enrichment.id,
            leadData: {
              firstName: enrichment.firstName,
              lastName: enrichment.lastName,
              title: enrichment.title,
              company: enrichment.organizationName,
              industry: enrichment.organizationIndustry,
            },
            clientData: clientData || { companyName: "", companyDescription: "" },
          } as EmailGenerateJobData,
        }));
        
        if (jobs.length > 0) {
          // Initialize run tracking with expected job count
          await initRunTracking(campaignRunId, jobs.length);
          await queues[QUEUE_NAMES.EMAIL_GENERATE].addBulk(jobs);
        } else {
          // No leads found - finalize run immediately
          await finalizeRun(campaignRunId, { total: 0, done: 0, failed: 0 });
        }
        
        return { leadsFound: result.people?.length || 0 };
      } catch (error) {
        console.error(`[lead-search] Error:`, error);
        throw error;
      }
    },
    {
      connection,
      concurrency: 3,
    }
  );
  
  worker.on("completed", (job) => {
    console.log(`[lead-search] Job ${job.id} completed`);
  });
  
  worker.on("failed", (job, err) => {
    console.error(`[lead-search] Job ${job?.id} failed:`, err);
  });
  
  return worker;
}
