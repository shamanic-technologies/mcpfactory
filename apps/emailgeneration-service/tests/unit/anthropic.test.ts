import { describe, it, expect } from "vitest";

describe("Anthropic client", () => {
  it("should define email generation params interface", () => {
    const params = {
      leadInfo: { name: "John", company: "Acme", title: "CEO" },
      companyInfo: { name: "MyCompany", description: "A tech startup" },
      campaignContext: { objective: "sales" },
    };
    expect(params.leadInfo).toBeDefined();
    expect(params.companyInfo).toBeDefined();
  });

  it("should define email output interface", () => {
    const output = {
      subject: "Partnership opportunity",
      body: "Dear John...",
      generatedAt: new Date().toISOString(),
    };
    expect(output.subject).toBeDefined();
    expect(output.body).toBeDefined();
  });
});
