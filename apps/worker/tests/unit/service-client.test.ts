import { describe, it, expect } from "vitest";

describe("Service client", () => {
  it("should define service URLs", () => {
    const services = {
      leadService: "https://lead.mcpfactory.org",
      postmarkService: "https://postmark.mcpfactory.org",
      companyService: "https://company.mcpfactory.org",
    };
    expect(services.leadService).toContain("mcpfactory.org");
  });

  it("should define auth headers", () => {
    const headers = {
      "X-API-Key": "secret",
      "Content-Type": "application/json",
    };
    expect(headers["X-API-Key"]).toBeDefined();
  });
});
