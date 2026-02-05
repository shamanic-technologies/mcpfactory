import { Worker, Job } from "bullmq";
import { getRedis } from "../lib/redis.js";
import { getQueues, QUEUE_NAMES, LeadSearchJobData, EmailGenerateJobData } from "../queues/index.js";
import { apolloService, leadService } from "../lib/service-client.js";
import { initRunTracking, finalizeRun } from "../lib/run-tracker.js";

interface ApolloEnrichment {
  id: string;
  firstName: string;
  lastName: string;
  title: string;
  email: string;
  linkedinUrl?: string;
  organizationName: string;
  organizationDomain?: string;
  organizationIndustry: string;
  organizationSize?: string;
  organizationRevenueUsd?: string;
}

interface CursorState {
  lastPage: number;
  exhausted: boolean;
}

interface BufferLead {
  email: string;
  externalId?: string;
  data: Record<string, unknown>;
}

const APOLLO_PAGE_SIZE = 25;
const MAX_LEADS_PER_RUN = 50;

/**
 * Lead Search Worker
 *
 * Searches Apollo for leads, pushes to lead-guard buffer for dedup,
 * then pulls deduplicated leads one-by-one and queues email generation.
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
        // 1. Read cursor from lead-guard
        let cursor: CursorState = { lastPage: 0, exhausted: false };
        try {
          const cursorResult = await leadService.getCursor(clerkOrgId, namespace) as { state: CursorState | null };
          if (cursorResult?.state) {
            cursor = cursorResult.state;
          }
        } catch {
          console.log(`[lead-search] No cursor found, starting fresh`);
        }

        // 2. If not exhausted, fetch next page from Apollo and push to buffer
        if (!cursor.exhausted) {
          const nextPage = cursor.lastPage + 1;
          console.log(`[lead-search] Fetching Apollo page ${nextPage}`);

          const result = await apolloService.search(clerkOrgId, {
            runId,
            page: nextPage,
            ...searchParams,
          }) as { people: ApolloEnrichment[] };

          const people = result.people || [];
          console.log(`[lead-search] Apollo returned ${people.length} leads`);

          if (people.length > 0) {
            const leads = people.map((p) => ({
              email: p.email,
              externalId: p.id,
              data: {
                firstName: p.firstName,
                lastName: p.lastName,
                title: p.title,
                email: p.email,
                linkedinUrl: p.linkedinUrl,
                organizationName: p.organizationName,
                organizationDomain: p.organizationDomain,
                organizationIndustry: p.organizationIndustry,
                organizationSize: p.organizationSize,
                organizationRevenueUsd: p.organizationRevenueUsd,
              },
            }));

            const pushResult = await leadService.push(clerkOrgId, namespace, runId, leads) as {
              buffered: number;
              skippedAlreadyServed: number;
            };
            console.log(
              `[lead-search] Buffer push: ${pushResult.buffered} new, ${pushResult.skippedAlreadyServed} already served`
            );
          }

          // Update cursor
          const exhausted = people.length < APOLLO_PAGE_SIZE;
          await leadService.setCursor(clerkOrgId, namespace, { lastPage: nextPage, exhausted });
          if (exhausted) {
            console.log(`[lead-search] Apollo results exhausted at page ${nextPage}`);
          }
        } else {
          console.log(`[lead-search] Apollo exhausted, pulling from buffer only`);
        }

        // 3. Pull deduplicated leads from buffer one-by-one
        const dedupedLeads: BufferLead[] = [];
        while (dedupedLeads.length < MAX_LEADS_PER_RUN) {
          const nextResult = await leadService.next(clerkOrgId, namespace, runId) as {
            found: boolean;
            lead?: BufferLead;
          };
          if (!nextResult.found || !nextResult.lead) break;
          dedupedLeads.push(nextResult.lead);
        }

        console.log(`[lead-search] Pulled ${dedupedLeads.length} deduped leads from buffer`);

        // 4. Queue email generation for each deduped lead
        const queues = getQueues();
        const jobs = dedupedLeads
          .filter((lead) => lead.data?.email)
          .map((lead) => ({
            name: `generate-${lead.externalId || lead.email}`,
            data: {
              runId,
              clerkOrgId,
              apolloEnrichmentId: lead.externalId || "",
              leadData: {
                firstName: lead.data.firstName as string,
                lastName: lead.data.lastName as string | undefined,
                title: lead.data.title as string | undefined,
                email: lead.data.email as string,
                linkedinUrl: lead.data.linkedinUrl as string | undefined,
                companyName: (lead.data.organizationName as string) || "",
                companyDomain: lead.data.organizationDomain as string | undefined,
                companyIndustry: lead.data.organizationIndustry as string | undefined,
                companySize: lead.data.organizationSize as string | undefined,
                companyRevenueUsd: lead.data.organizationRevenueUsd as string | undefined,
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

        return { leadsFound: dedupedLeads.length, jobsQueued: jobs.length };
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
