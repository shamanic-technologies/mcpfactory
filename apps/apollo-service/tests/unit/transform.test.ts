import { describe, it, expect } from "vitest";

/**
 * Tests for Apollo API response transformation
 * The search route transforms snake_case Apollo API responses to camelCase
 */

interface ApolloPerson {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  email_status: string;
  title: string;
  linkedin_url: string;
  organization?: {
    name: string;
    primary_domain: string;
    industry: string;
    estimated_num_employees: number;
  };
}

interface TransformedPerson {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  emailStatus: string;
  title: string;
  linkedinUrl: string;
  organizationName: string | undefined;
  organizationDomain: string | undefined;
  organizationIndustry: string | undefined;
  organizationSize: string | undefined;
}

function transformPerson(person: ApolloPerson): TransformedPerson {
  return {
    id: person.id,
    firstName: person.first_name,
    lastName: person.last_name,
    email: person.email,
    emailStatus: person.email_status,
    title: person.title,
    linkedinUrl: person.linkedin_url,
    organizationName: person.organization?.name,
    organizationDomain: person.organization?.primary_domain,
    organizationIndustry: person.organization?.industry,
    organizationSize: person.organization?.estimated_num_employees?.toString(),
  };
}

describe("Apollo response transformation", () => {
  it("should transform snake_case to camelCase", () => {
    const apolloPerson: ApolloPerson = {
      id: "abc123",
      first_name: "John",
      last_name: "Doe",
      email: "john@example.com",
      email_status: "verified",
      title: "CEO",
      linkedin_url: "https://linkedin.com/in/johndoe",
      organization: {
        name: "Acme Corp",
        primary_domain: "acme.com",
        industry: "Technology",
        estimated_num_employees: 50,
      },
    };

    const result = transformPerson(apolloPerson);

    expect(result.id).toBe("abc123");
    expect(result.firstName).toBe("John");
    expect(result.lastName).toBe("Doe");
    expect(result.email).toBe("john@example.com");
    expect(result.emailStatus).toBe("verified");
    expect(result.title).toBe("CEO");
    expect(result.linkedinUrl).toBe("https://linkedin.com/in/johndoe");
    expect(result.organizationName).toBe("Acme Corp");
    expect(result.organizationDomain).toBe("acme.com");
    expect(result.organizationIndustry).toBe("Technology");
    expect(result.organizationSize).toBe("50");
  });

  it("should handle missing organization", () => {
    const apolloPerson: ApolloPerson = {
      id: "abc123",
      first_name: "Jane",
      last_name: "Smith",
      email: "jane@example.com",
      email_status: "guessed",
      title: "Engineer",
      linkedin_url: "",
    };

    const result = transformPerson(apolloPerson);

    expect(result.firstName).toBe("Jane");
    expect(result.organizationName).toBeUndefined();
    expect(result.organizationDomain).toBeUndefined();
    expect(result.organizationIndustry).toBeUndefined();
    expect(result.organizationSize).toBeUndefined();
  });

  it("should transform array of people", () => {
    const apolloPeople: ApolloPerson[] = [
      {
        id: "1",
        first_name: "Alice",
        last_name: "Brown",
        email: "alice@test.com",
        email_status: "verified",
        title: "CTO",
        linkedin_url: "",
        organization: { name: "TechCo", primary_domain: "techco.io", industry: "SaaS", estimated_num_employees: 100 },
      },
      {
        id: "2",
        first_name: "Bob",
        last_name: "Wilson",
        email: "bob@test.com",
        email_status: "verified",
        title: "VP Sales",
        linkedin_url: "",
        organization: { name: "SalesCo", primary_domain: "salesco.com", industry: "Sales", estimated_num_employees: 25 },
      },
    ];

    const results = apolloPeople.map(transformPerson);

    expect(results).toHaveLength(2);
    expect(results[0].firstName).toBe("Alice");
    expect(results[0].organizationName).toBe("TechCo");
    expect(results[1].firstName).toBe("Bob");
    expect(results[1].organizationName).toBe("SalesCo");
  });
});
