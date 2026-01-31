import { describe, it, expect } from "vitest";

/**
 * Tests for lead-search worker data mapping
 * Ensures the worker correctly maps Apollo response to email-generate job data
 */

interface ApolloEnrichment {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  emailStatus: string;
  title: string;
  linkedinUrl: string;
  organizationName: string;
  organizationDomain: string;
  organizationIndustry: string;
  organizationSize: string;
}

interface EmailGenerateJobData {
  campaignRunId: string;
  clerkOrgId: string;
  apolloEnrichmentId: string;
  leadData: {
    firstName: string;
    lastName: string;
    title: string;
    company: string;
    industry: string;
  };
  clientData: {
    companyName: string;
    companyDescription: string;
  };
}

function mapEnrichmentToJobData(
  enrichment: ApolloEnrichment,
  campaignRunId: string,
  clerkOrgId: string
): EmailGenerateJobData {
  return {
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
    clientData: {
      companyName: "",
      companyDescription: "",
    },
  };
}

describe("Lead search worker data mapping", () => {
  const mockEnrichment: ApolloEnrichment = {
    id: "enrich123",
    firstName: "John",
    lastName: "Doe",
    email: "john@acme.com",
    emailStatus: "verified",
    title: "CEO",
    linkedinUrl: "https://linkedin.com/in/johndoe",
    organizationName: "Acme Corp",
    organizationDomain: "acme.com",
    organizationIndustry: "Technology",
    organizationSize: "50",
  };

  it("should map enrichment to email-generate job data", () => {
    const jobData = mapEnrichmentToJobData(mockEnrichment, "run123", "org_abc");

    expect(jobData.campaignRunId).toBe("run123");
    expect(jobData.clerkOrgId).toBe("org_abc");
    expect(jobData.apolloEnrichmentId).toBe("enrich123");
  });

  it("should correctly map leadData fields", () => {
    const jobData = mapEnrichmentToJobData(mockEnrichment, "run123", "org_abc");

    expect(jobData.leadData.firstName).toBe("John");
    expect(jobData.leadData.lastName).toBe("Doe");
    expect(jobData.leadData.title).toBe("CEO");
    expect(jobData.leadData.company).toBe("Acme Corp");
    expect(jobData.leadData.industry).toBe("Technology");
  });

  it("should provide empty clientData (to be filled later)", () => {
    const jobData = mapEnrichmentToJobData(mockEnrichment, "run123", "org_abc");

    expect(jobData.clientData.companyName).toBe("");
    expect(jobData.clientData.companyDescription).toBe("");
  });

  it("should map multiple enrichments to job array", () => {
    const enrichments: ApolloEnrichment[] = [
      { ...mockEnrichment, id: "1", firstName: "Alice" },
      { ...mockEnrichment, id: "2", firstName: "Bob" },
      { ...mockEnrichment, id: "3", firstName: "Charlie" },
    ];

    const jobs = enrichments.map((e) => ({
      name: `generate-${e.id}`,
      data: mapEnrichmentToJobData(e, "run123", "org_abc"),
    }));

    expect(jobs).toHaveLength(3);
    expect(jobs[0].name).toBe("generate-1");
    expect(jobs[0].data.leadData.firstName).toBe("Alice");
    expect(jobs[1].name).toBe("generate-2");
    expect(jobs[1].data.leadData.firstName).toBe("Bob");
    expect(jobs[2].name).toBe("generate-3");
    expect(jobs[2].data.leadData.firstName).toBe("Charlie");
  });
});
