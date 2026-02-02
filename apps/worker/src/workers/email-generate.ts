import { Worker, Job } from "bullmq";
import { getRedis } from "../lib/redis.js";
import { getQueues, QUEUE_NAMES, EmailGenerateJobData, EmailSendJobData } from "../queues/index.js";
import { emailGenerationService } from "../lib/service-client.js";
import { markJobDone, finalizeRun } from "../lib/run-tracker.js";

interface GenerationResult {
  id: string;
  subject: string;
  bodyHtml: string;
}

/**
 * Email Generate Worker
 * 
 * Generates personalized emails for each lead
 * Then queues email send jobs
 */
export function startEmailGenerateWorker(): Worker {
  const connection = getRedis();
  
  const worker = new Worker<EmailGenerateJobData>(
    QUEUE_NAMES.EMAIL_GENERATE,
    async (job: Job<EmailGenerateJobData>) => {
      const { runId, clerkOrgId, apolloEnrichmentId, leadData, clientData } = job.data;
      
      console.log(`[email-generate] Generating email for enrichment ${apolloEnrichmentId}`);
      
      try {
        // Call email generation service with all available data
        const result = await emailGenerationService.generate(clerkOrgId, {
          runId,
          apolloEnrichmentId,
          // Lead person info
          leadFirstName: leadData.firstName,
          leadLastName: leadData.lastName,
          leadTitle: leadData.title,
          leadEmail: leadData.email,
          leadLinkedinUrl: leadData.linkedinUrl,
          // Lead company info
          leadCompanyName: leadData.companyName,
          leadCompanyDomain: leadData.companyDomain,
          leadCompanyIndustry: leadData.companyIndustry,
          leadCompanySize: leadData.companySize,
          leadCompanyRevenueUsd: leadData.companyRevenueUsd,
          // Client (our company) info
          clientCompanyName: clientData.companyName,
          clientCompanyOverview: clientData.companyOverview,
          clientValueProposition: clientData.valueProposition,
          clientTargetAudience: clientData.targetAudience,
          clientCustomerPainPoints: clientData.customerPainPoints,
          clientKeyFeatures: clientData.keyFeatures,
          clientProductDifferentiators: clientData.productDifferentiators,
          clientCompetitors: clientData.competitors,
          clientSocialProof: clientData.socialProof,
          clientCallToAction: clientData.callToAction,
          clientAdditionalContext: clientData.additionalContext,
        }) as GenerationResult;
        
        console.log(`[email-generate] Generated email with subject: ${result.subject}`);
        
        // Queue email send job with lead's email
        const queues = getQueues();
        await queues[QUEUE_NAMES.EMAIL_SEND].add(
          `send-${result.id}`,
          {
            runId,
            clerkOrgId,
            emailGenerationId: result.id,
            toEmail: leadData.email || "",
            subject: result.subject,
            bodyHtml: result.bodyHtml,
          } as EmailSendJobData
        );
        
        return { generationId: result.id };
      } catch (error) {
        console.error(`[email-generate] Error:`, error);
        throw error;
      }
    },
    {
      connection,
      concurrency: 10, // Can process many in parallel
      limiter: {
        max: 50,
        duration: 60000, // Max 50 per minute (rate limit for Anthropic)
      },
    }
  );
  
  worker.on("completed", async (job) => {
    console.log(`[email-generate] Job ${job.id} completed`);
    
    // Track completion and check if this was the last job
    const { runId } = job.data;
    const result = await markJobDone(runId, true);
    
    if (result.isLast) {
      await finalizeRun(runId, result);
    }
  });
  
  worker.on("failed", async (job, err) => {
    console.error(`[email-generate] Job ${job?.id} failed:`, err);
    
    if (job) {
      // Track failure and check if this was the last job
      const { runId } = job.data;
      const result = await markJobDone(runId, false);
      
      if (result.isLast) {
        await finalizeRun(runId, result);
      }
    }
  });
  
  return worker;
}
