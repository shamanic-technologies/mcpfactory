import { Worker, Job } from "bullmq";
import { getRedis } from "../lib/redis.js";
import { getQueues, QUEUE_NAMES, EmailGenerateJobData, EmailSendJobData } from "../queues/index.js";
import { emailGenerationService } from "../lib/service-client.js";

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
      const { campaignRunId, clerkOrgId, apolloEnrichmentId, leadData, clientData } = job.data;
      
      console.log(`[email-generate] Generating email for enrichment ${apolloEnrichmentId}`);
      
      try {
        // Call email generation service
        const result = await emailGenerationService.generate(clerkOrgId, {
          campaignRunId,
          apolloEnrichmentId,
          leadFirstName: leadData.firstName,
          leadLastName: leadData.lastName,
          leadTitle: leadData.title,
          leadCompany: leadData.company,
          leadIndustry: leadData.industry,
          clientCompanyName: clientData.companyName,
          clientCompanyDescription: clientData.companyDescription,
        }) as GenerationResult;
        
        console.log(`[email-generate] Generated email with subject: ${result.subject}`);
        
        // Queue email send job
        // Note: We'd need the lead's email from the enrichment data
        // This is simplified - in production we'd pass the email through the job chain
        const queues = getQueues();
        await queues[QUEUE_NAMES.EMAIL_SEND].add(
          `send-${result.id}`,
          {
            campaignRunId,
            clerkOrgId,
            emailGenerationId: result.id,
            toEmail: "", // Would come from lead data
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
  
  worker.on("completed", (job) => {
    console.log(`[email-generate] Job ${job.id} completed`);
  });
  
  worker.on("failed", (job, err) => {
    console.error(`[email-generate] Job ${job?.id} failed:`, err);
  });
  
  return worker;
}
