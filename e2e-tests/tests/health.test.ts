import { describe, it, expect } from "vitest";

const SERVICES = {
  replyQualification: process.env.REPLY_QUALIFICATION_SERVICE_URL || "https://reply-qualification.mcpfactory.org",
  company: process.env.COMPANY_SERVICE_URL || "https://company.mcpfactory.org",
  postmark: process.env.POSTMARK_SERVICE_URL || "https://postmark.mcpfactory.org",
};

describe("Health Checks - All Services", () => {
  it("reply-qualification-service should be healthy", async () => {
    const response = await fetch(`${SERVICES.replyQualification}/health`);
    expect(response.ok).toBe(true);
    
    const data = await response.json();
    expect(data.status).toBe("ok");
    expect(data.service).toBe("reply-qualification-service");
  });

  it("company-service should be healthy", async () => {
    const response = await fetch(`${SERVICES.company}/health`);
    expect(response.ok).toBe(true);
    
    const data = await response.json();
    expect(data.status).toBe("ok");
  });

  it("postmark-service should be healthy", async () => {
    const response = await fetch(`${SERVICES.postmark}/health`);
    expect(response.ok).toBe(true);
    
    const data = await response.json();
    expect(data.status).toBe("ok");
  });
});

describe("Response Times", () => {
  it("all health endpoints should respond within 2 seconds", async () => {
    const services = Object.entries(SERVICES);
    
    for (const [name, url] of services) {
      const start = Date.now();
      const response = await fetch(`${url}/health`);
      const elapsed = Date.now() - start;
      
      console.log(`${name}: ${elapsed}ms`);
      expect(elapsed).toBeLessThan(2000);
      expect(response.ok).toBe(true);
    }
  });
});
