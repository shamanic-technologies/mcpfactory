import { Queue } from "bullmq";
import { getRedis } from "../lib/redis.js";

// Queue names
export const QUEUE_NAMES = {
  BRAND_UPSERT: "brand-upsert",
  BRAND_PROFILE: "brand-profile",
  LEAD_SEARCH: "lead-search",
  LEAD_ENRICH: "lead-enrich",
  EMAIL_GENERATE: "email-generate",
  EMAIL_SEND: "email-send",
} as const;

// Queue instances (lazy initialized)
let queues: Record<string, Queue> | null = null;

export function getQueues(): Record<string, Queue> {
  if (!queues) {
    const connection = getRedis();
    
    queues = {
      [QUEUE_NAMES.BRAND_UPSERT]: new Queue(QUEUE_NAMES.BRAND_UPSERT, { connection }),
      [QUEUE_NAMES.BRAND_PROFILE]: new Queue(QUEUE_NAMES.BRAND_PROFILE, { connection }),
      [QUEUE_NAMES.LEAD_SEARCH]: new Queue(QUEUE_NAMES.LEAD_SEARCH, { connection }),
      [QUEUE_NAMES.LEAD_ENRICH]: new Queue(QUEUE_NAMES.LEAD_ENRICH, { connection }),
      [QUEUE_NAMES.EMAIL_GENERATE]: new Queue(QUEUE_NAMES.EMAIL_GENERATE, { connection }),
      [QUEUE_NAMES.EMAIL_SEND]: new Queue(QUEUE_NAMES.EMAIL_SEND, { connection }),
    };
  }
  return queues;
}

// Job data types

export interface BrandUpsertJobData {
  campaignId: string;
  clerkOrgId: string;
}

export interface BrandProfileJobData {
  campaignId: string;
  campaignRunId: string;
  clerkOrgId: string;
  brandUrl: string;
  searchParams: {
    personTitles?: string[];
    organizationLocations?: string[];
    qOrganizationKeywordTags?: string[];
    organizationNumEmployeesRanges?: string[];
    qOrganizationIndustryTagIds?: string[];
    qKeywords?: string;
  };
}

export interface LeadSearchJobData {
  campaignRunId: string;
  clerkOrgId: string;
  brandId?: string;
  searchParams: {
    personTitles?: string[];
    organizationLocations?: string[];
    qOrganizationKeywordTags?: string[];
    organizationNumEmployeesRanges?: string[];
    qOrganizationIndustryTagIds?: string[];
    qKeywords?: string;
  };
  clientData: {
    companyName: string;
    companyOverview?: string;
    valueProposition?: string;
    targetAudience?: string;
    customerPainPoints?: string[];
    keyFeatures?: string[];
    productDifferentiators?: string[];
    competitors?: string[];
    socialProof?: {
      caseStudies?: string[];
      testimonials?: string[];
      results?: string[];
    };
    callToAction?: string;
    additionalContext?: string;
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
    email?: string;
    linkedinUrl?: string;
    companyName: string;
    companyDomain?: string;
    companyIndustry?: string;
    companySize?: string;
    companyRevenueUsd?: string;
  };
  clientData: {
    companyName: string;
    companyOverview?: string;
    valueProposition?: string;
    targetAudience?: string;
    customerPainPoints?: string[];
    keyFeatures?: string[];
    productDifferentiators?: string[];
    competitors?: string[];
    socialProof?: {
      caseStudies?: string[];
      testimonials?: string[];
      results?: string[];
    };
    callToAction?: string;
    additionalContext?: string;
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
