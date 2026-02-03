import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import request from "supertest";

/**
 * Regression test: email generation cost tracking
 *
 * Bug: Campaign showed $0.11 total cost for 350 leads + 350 emails generated
 * with Opus 4.5. Real cost should have been ~$9-23.
 *
 * Root causes:
 * 1. Cost tracking errors were silently swallowed (console.warn instead of console.error)
 * 2. Cost names may not be registered in runs-service catalog
 * 3. Locally computed costUsd was never used in reporting
 *
 * These tests verify:
 * - Correct cost names are used when posting to runs-service
 * - Token quantities are posted (not dollar amounts)
 * - Errors in cost tracking are logged at error level
 */

// Mock runs-client before importing the route
const mockEnsureOrganization = vi.fn().mockResolvedValue("org-123");
const mockCreateRun = vi.fn().mockResolvedValue({ id: "run-456" });
const mockUpdateRun = vi.fn().mockResolvedValue({});
const mockAddCosts = vi.fn().mockResolvedValue({ costs: [] });

vi.mock("@mcpfactory/runs-client", () => ({
  ensureOrganization: (...args: unknown[]) => mockEnsureOrganization(...args),
  createRun: (...args: unknown[]) => mockCreateRun(...args),
  updateRun: (...args: unknown[]) => mockUpdateRun(...args),
  addCosts: (...args: unknown[]) => mockAddCosts(...args),
}));

// Mock auth middleware to pass through
vi.mock("../../src/middleware/auth.js", () => ({
  serviceAuth: (req: any, _res: any, next: any) => {
    req.orgId = "org-internal-123";
    req.clerkOrgId = req.headers["x-clerk-org-id"] || "org_test";
    next();
  },
}));

// Mock the DB — track db.update().set() calls to verify generationRunId linking
const mockDbSetCalls: Array<Record<string, unknown>> = [];
vi.mock("../../src/db/index.js", () => ({
  db: {
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ id: "gen-789" }]),
      }),
    }),
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockImplementation((data: Record<string, unknown>) => {
        mockDbSetCalls.push(data);
        return { where: vi.fn().mockResolvedValue(undefined) };
      }),
    }),
  },
}));

vi.mock("../../src/db/schema.js", () => ({
  emailGenerations: { id: { name: "id" } },
}));

vi.mock("../../src/lib/keys-client.js", () => ({
  getByokKey: vi.fn().mockResolvedValue("fake-anthropic-key"),
}));

// Mock anthropic client to return predictable token counts
const MOCK_TOKENS_INPUT = 1500;
const MOCK_TOKENS_OUTPUT = 300;
vi.mock("../../src/lib/anthropic-client.js", () => ({
  generateEmail: vi.fn().mockResolvedValue({
    subject: "Test subject",
    bodyHtml: "<p>Test body</p>",
    bodyText: "Test body",
    tokensInput: MOCK_TOKENS_INPUT,
    tokensOutput: MOCK_TOKENS_OUTPUT,
    costUsd: 0.015,
    promptRaw: "test prompt",
    responseRaw: {},
  }),
}));

function createTestApp() {
  const app = express();
  app.use(express.json());
  return app;
}

describe("Email generation cost tracking", () => {
  let app: express.Express;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockDbSetCalls.length = 0;
    mockEnsureOrganization.mockResolvedValue("org-123");
    mockCreateRun.mockResolvedValue({ id: "run-456" });
    mockUpdateRun.mockResolvedValue({});
    mockAddCosts.mockResolvedValue({ costs: [] });

    app = createTestApp();
    const { default: generateRoutes } = await import("../../src/routes/generate.js");
    app.use(generateRoutes);
  });

  it("should post costs with exact cost names: anthropic-opus-4.5-tokens-input and anthropic-opus-4.5-tokens-output", async () => {
    await request(app)
      .post("/generate")
      .set("X-Clerk-Org-Id", "org_test")
      .send({
        runId: "run-parent-123",
        apolloEnrichmentId: "enrich-123",
        leadFirstName: "John",
        leadCompanyName: "Acme Corp",
        clientCompanyName: "MyCompany",
      })
      .expect(200);

    // Verify addCosts was called with correct cost names
    expect(mockAddCosts).toHaveBeenCalledTimes(1);
    const [runId, costItems] = mockAddCosts.mock.calls[0];
    expect(runId).toBe("run-456");

    const costNames = costItems.map((c: { costName: string }) => c.costName);
    expect(costNames).toContain("anthropic-opus-4.5-tokens-input");
    expect(costNames).toContain("anthropic-opus-4.5-tokens-output");
  });

  it("should post raw token quantities, not dollar amounts", async () => {
    await request(app)
      .post("/generate")
      .set("X-Clerk-Org-Id", "org_test")
      .send({
        runId: "run-parent-123",
        apolloEnrichmentId: "enrich-123",
        leadFirstName: "John",
        leadCompanyName: "Acme Corp",
        clientCompanyName: "MyCompany",
      })
      .expect(200);

    const [, costItems] = mockAddCosts.mock.calls[0];
    const inputCost = costItems.find((c: { costName: string }) => c.costName === "anthropic-opus-4.5-tokens-input");
    const outputCost = costItems.find((c: { costName: string }) => c.costName === "anthropic-opus-4.5-tokens-output");

    // Quantities must be raw token counts, not dollar values
    expect(inputCost.quantity).toBe(MOCK_TOKENS_INPUT);
    expect(outputCost.quantity).toBe(MOCK_TOKENS_OUTPUT);

    // Sanity: token counts should be integers > 1 (not fractional dollar values)
    expect(Number.isInteger(inputCost.quantity)).toBe(true);
    expect(inputCost.quantity).toBeGreaterThan(1);
  });

  it("should log at error level when cost tracking fails", async () => {
    mockCreateRun.mockResolvedValueOnce({ id: "run-456" });
    mockAddCosts.mockRejectedValueOnce(new Error("Cost name not registered"));

    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await request(app)
      .post("/generate")
      .set("X-Clerk-Org-Id", "org_test")
      .send({
        runId: "run-parent-123",
        apolloEnrichmentId: "enrich-123",
        leadFirstName: "John",
        leadCompanyName: "Acme Corp",
        clientCompanyName: "MyCompany",
      })
      .expect(200); // Email still generated despite cost tracking failure

    // Must log at error level (not warn) so it shows up in monitoring
    const costErrorCall = errorSpy.mock.calls.find(
      (call) => typeof call[0] === "string" && call[0].includes("COST TRACKING FAILED")
    );
    expect(costErrorCall).toBeDefined();

    errorSpy.mockRestore();
  });

  it("should create child run with correct parentRunId linking to campaign run", async () => {
    await request(app)
      .post("/generate")
      .set("X-Clerk-Org-Id", "org_test")
      .send({
        runId: "campaign-run-abc",
        apolloEnrichmentId: "enrich-123",
        leadFirstName: "John",
        leadCompanyName: "Acme Corp",
        clientCompanyName: "MyCompany",
      })
      .expect(200);

    expect(mockCreateRun).toHaveBeenCalledWith(
      expect.objectContaining({
        parentRunId: "campaign-run-abc",
        serviceName: "emailgeneration-service",
        taskName: "single-generation",
      })
    );
  });

  it("should link generationRunId to DB record even when addCosts fails", async () => {
    // This is the critical regression: if addCosts fails, the DB link must
    // still be set so the dashboard can show per-item cost details.
    mockCreateRun.mockResolvedValueOnce({ id: "run-456" });
    mockAddCosts.mockRejectedValueOnce(new Error("Cost name not registered"));

    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await request(app)
      .post("/generate")
      .set("X-Clerk-Org-Id", "org_test")
      .send({
        runId: "run-parent-123",
        apolloEnrichmentId: "enrich-123",
        leadFirstName: "John",
        leadCompanyName: "Acme Corp",
        clientCompanyName: "MyCompany",
      })
      .expect(200);

    // generationRunId must be set in the DB even though addCosts failed
    const linkCall = mockDbSetCalls.find((data) => "generationRunId" in data);
    expect(linkCall).toBeDefined();
    expect(linkCall!.generationRunId).toBe("run-456");

    errorSpy.mockRestore();
  });
});
