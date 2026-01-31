import { Queue } from "bullmq";
import { getRedis } from "../lib/redis.js";

// Queue names
export const QUEUE_NAMES = {
  CAMPAIGN_RUN: "campaign-run",
  LEAD_SEARCH: "lead-search",
  LEAD_ENRICH: "lead-enrich",
  COMPANY_SCRAPE: "company-scrape",
  EMAIL_GENERATE: "email-generate",
  EMAIL_SEND: "email-send",
} as const;

// Queue instances (lazy initialized)
let queues: Record<string, Queue> | null = null;

export function getQueues(): Record<string, Queue> {
  if (!queues) {
    const connection = getRedis();
    
    queues = {
      [QUEUE_NAMES.CAMPAIGN_RUN]: new Queue(QUEUE_NAMES.CAMPAIGN_RUN, { connection }),
      [QUEUE_NAMES.LEAD_SEARCH]: new Queue(QUEUE_NAMES.LEAD_SEARCH, { connection }),
      [QUEUE_NAMES.LEAD_ENRICH]: new Queue(QUEUE_NAMES.LEAD_ENRICH, { connection }),
      [QUEUE_NAMES.COMPANY_SCRAPE]: new Queue(QUEUE_NAMES.COMPANY_SCRAPE, { connection }),
      [QUEUE_NAMES.EMAIL_GENERATE]: new Queue(QUEUE_NAMES.EMAIL_GENERATE, { connection }),
      [QUEUE_NAMES.EMAIL_SEND]: new Queue(QUEUE_NAMES.EMAIL_SEND, { connection }),
    };
  }
  return queues;
}

// Job data types
export interface CampaignRunJobData {
  campaignId: string;
  clerkOrgId: string;
  campaignRunId?: string;
}

export interface LeadSearchJobData {
  campaignRunId: string;
  clerkOrgId: string;
  searchParams: Record<string, unknown>;
  clientData: {
    companyName: string;
    companyDescription: string;
  };
}

export interface LeadEnrichJobData {
  campaignRunId: string;
  clerkOrgId: string;
  apolloPersonId: string;
  apolloEnrichmentId: string;
}

export interface CompanyScrapeJobData {
  campaignRunId: string;
  clerkOrgId: string;
  companyUrl: string;
}

export interface EmailGenerateJobData {
  campaignRunId: string;
  clerkOrgId: string;
  apolloEnrichmentId: string;
  leadData: {
    firstName: string;
    lastName?: string;
    title?: string;
    company: string;
    industry?: string;
  };
  clientData: {
    companyName: string;
    companyDescription: string;
  };
}

export interface EmailSendJobData {
  campaignRunId: string;
  clerkOrgId: string;
  emailGenerationId: string;
  toEmail: string;
  subject: string;
  bodyHtml: string;
}
