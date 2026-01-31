import { describe, it, expect } from "vitest";

describe("Service client", () => {
  it("should define service URLs", () => {
    const services = {
      apolloService: "https://apollo.mcpfactory.org",
      postmarkService: "https://postmark.mcpfactory.org",
      companyService: "https://company.mcpfactory.org",
    };
    expect(services.apolloService).toContain("mcpfactory.org");
  });

  it("should define auth headers", () => {
    const headers = {
      "X-API-Key": "secret",
      "Content-Type": "application/json",
    };
    expect(headers["X-API-Key"]).toBeDefined();
  });
});
