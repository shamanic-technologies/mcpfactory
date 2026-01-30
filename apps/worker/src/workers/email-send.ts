import { Worker, Job } from "bullmq";
import { getRedis } from "../lib/redis.js";
import { QUEUE_NAMES, EmailSendJobData } from "../queues/index.js";
import { postmarkService } from "../lib/service-client.js";

/**
 * Email Send Worker
 * 
 * Sends generated emails via Postmark
 */
export function startEmailSendWorker(): Worker {
  const connection = getRedis();
  
  const worker = new Worker<EmailSendJobData>(
    QUEUE_NAMES.EMAIL_SEND,
    async (job: Job<EmailSendJobData>) => {
      const { campaignRunId, clerkOrgId, emailGenerationId, toEmail, subject, bodyHtml } = job.data;
      
      if (!toEmail) {
        console.log(`[email-send] Skipping - no email address`);
        return { skipped: true };
      }
      
      console.log(`[email-send] Sending email to ${toEmail}`);
      
      try {
        // Get the from address from env (our growth agency email)
        const fromEmail = process.env.EMAIL_FROM_ADDRESS || "growth@mcpfactory.org";
        
        // Call Postmark service
        const result = await postmarkService.send({
          orgId: clerkOrgId,
          campaignRunId,
          from: fromEmail,
          to: toEmail,
          subject,
          htmlBody: bodyHtml,
          tag: "cold-email",
          metadata: {
            emailGenerationId,
            source: "mcpfactory-worker",
          },
        });
        
        console.log(`[email-send] Sent email to ${toEmail}`);
        
        return { sent: true, result };
      } catch (error) {
        console.error(`[email-send] Error:`, error);
        throw error;
      }
    },
    {
      connection,
      concurrency: 5,
      limiter: {
        max: 20,
        duration: 60000, // Max 20 per minute (be conservative with email sending)
      },
    }
  );
  
  worker.on("completed", (job) => {
    console.log(`[email-send] Job ${job.id} completed`);
  });
  
  worker.on("failed", (job, err) => {
    console.error(`[email-send] Job ${job?.id} failed:`, err);
  });
  
  return worker;
}
