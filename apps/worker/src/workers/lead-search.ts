import { Worker, Job } from "bullmq";
import { getRedis } from "../lib/redis.js";
import { getQueues, QUEUE_NAMES, LeadSearchJobData, EmailGenerateJobData } from "../queues/index.js";
import { leadService } from "../lib/service-client.js";
import { initRunTracking, finalizeRun } from "../lib/run-tracker.js";

interface LeadData {
  email: string;
  externalId?: string;
  firstName?: string;
  lastName?: string;
  title?: string;
  linkedinUrl?: string;
  organizationName?: string;
  organizationDomain?: string;
  organizationIndustry?: string;
  organizationSize?: string;
  organizationRevenueUsd?: string;
}

const MAX_LEADS_PER_RUN = 50;

/**
 * Lead Search Worker
 *
 * Pulls leads from lead-service one-by-one.
 * Lead-service handles Apollo search + dedup internally.
 */
export function startLeadSearchWorker(): Worker {
  const connection = getRedis();

  const worker = new Worker<LeadSearchJobData>(
    QUEUE_NAMES.LEAD_SEARCH,
    async (job: Job<LeadSearchJobData>) => {
      const { runId, clerkOrgId, campaignId, brandId, searchParams, clientData } = job.data;
      const namespace = brandId;

      console.log(`[lead-search] Starting for run ${runId}, campaign ${campaignId}, brand ${brandId}`);
      console.log(`[lead-search] Client: ${clientData?.companyName || "(no client data)"}`);

      try {
        // Pull leads from lead-service (handles Apollo search + dedup internally)
        const leads: LeadData[] = [];
        while (leads.length < MAX_LEADS_PER_RUN) {
          const result = await leadService.next(clerkOrgId, namespace, runId, searchParams) as {
            found: boolean;
            lead?: LeadData;
          };
          if (!result.found || !result.lead) break;
          leads.push(result.lead);
        }

        console.log(`[lead-search] Got ${leads.length} leads from lead-service`);

        // Queue email generation for each lead
        const queues = getQueues();
        const jobs = leads
          .filter((lead) => lead.email)
          .map((lead) => ({
            name: `generate-${lead.externalId || lead.email}`,
            data: {
              runId,
              clerkOrgId,
              apolloEnrichmentId: lead.externalId || "",
              leadData: {
                firstName: lead.firstName || "",
                lastName: lead.lastName,
                title: lead.title,
                email: lead.email!,
                linkedinUrl: lead.linkedinUrl,
                companyName: lead.organizationName || "",
                companyDomain: lead.organizationDomain,
                companyIndustry: lead.organizationIndustry,
                companySize: lead.organizationSize,
                companyRevenueUsd: lead.organizationRevenueUsd,
              },
              clientData: clientData || { companyName: "" },
            } as EmailGenerateJobData,
          }));

        if (jobs.length > 0) {
          await initRunTracking(runId, jobs.length);
          await queues[QUEUE_NAMES.EMAIL_GENERATE].addBulk(jobs);
          console.log(`[lead-search] Queued ${jobs.length} email generation jobs`);
        } else {
          console.log(`[lead-search] No leads to process, finalizing run`);
          await finalizeRun(runId, { total: 0, done: 0, failed: 0 });
        }

        return { leadsFound: leads.length, jobsQueued: jobs.length };
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
