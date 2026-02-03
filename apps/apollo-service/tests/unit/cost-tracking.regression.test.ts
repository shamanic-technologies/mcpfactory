import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import request from "supertest";

/**
 * Regression test: Apollo service cost tracking
 *
 * Bug: Campaign showed $0.11 total cost for 350 leads. Apollo enrichment
 * credits were either not tracked or priced at near-zero in runs-service.
 *
 * These tests verify:
 * - Correct cost names are used (apollo-enrichment-credit, apollo-search-credit)
 * - One enrichment cost is posted per person
 * - One search cost is posted per search
 * - Errors are logged at error level (not silently swallowed)
 */

// Mock runs-client before importing the route
const mockEnsureOrganization = vi.fn().mockResolvedValue("org-123");
const mockCreateRun = vi.fn();
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

// Mock the DB — track db.update().set() calls to verify enrichmentRunId linking
const mockInsertReturning = vi.fn().mockResolvedValue([{ id: "record-1" }]);
const mockDbSetCalls: Array<Record<string, unknown>> = [];
vi.mock("../../src/db/index.js", () => ({
  db: {
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: (...args: unknown[]) => mockInsertReturning(...args),
      }),
    }),
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockImplementation((data: Record<string, unknown>) => {
        mockDbSetCalls.push(data);
        return { where: vi.fn().mockResolvedValue(undefined) };
      }),
    }),
    query: {
      apolloPeopleSearches: { findMany: vi.fn().mockResolvedValue([]) },
      apolloPeopleEnrichments: { findMany: vi.fn().mockResolvedValue([]) },
    },
  },
}));

vi.mock("../../src/db/schema.js", () => ({
  apolloPeopleSearches: { id: { name: "id" } },
  apolloPeopleEnrichments: { id: { name: "id" } },
}));

vi.mock("../../src/lib/keys-client.js", () => ({
  getByokKey: vi.fn().mockResolvedValue("fake-apollo-key"),
}));

// Mock Apollo client to return N people
const MOCK_PEOPLE_COUNT = 3;
const mockPeople = Array.from({ length: MOCK_PEOPLE_COUNT }, (_, i) => ({
  id: `person-${i}`,
  first_name: `First${i}`,
  last_name: `Last${i}`,
  email: `person${i}@example.com`,
  email_status: "verified",
  title: "CEO",
  linkedin_url: null,
  organization: {
    name: `Company${i}`,
    primary_domain: `company${i}.com`,
    industry: "tech",
    estimated_num_employees: 50,
    annual_revenue: null,
  },
}));

vi.mock("../../src/lib/apollo-client.js", () => ({
  searchPeople: vi.fn().mockResolvedValue({
    people: mockPeople,
    total_entries: MOCK_PEOPLE_COUNT,
  }),
}));

function createTestApp() {
  const app = express();
  app.use(express.json());
  return app;
}

describe("Apollo service cost tracking", () => {
  let app: express.Express;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockDbSetCalls.length = 0;
    mockEnsureOrganization.mockResolvedValue("org-123");
    mockUpdateRun.mockResolvedValue({});
    mockAddCosts.mockResolvedValue({ costs: [] });
    mockInsertReturning.mockResolvedValue([{ id: "record-1" }]);

    // First call = search run, subsequent calls = enrichment runs
    let callCount = 0;
    mockCreateRun.mockImplementation(() => {
      callCount++;
      return Promise.resolve({ id: `run-${callCount}` });
    });

    app = createTestApp();
    const { default: searchRoutes } = await import("../../src/routes/search.js");
    app.use(searchRoutes);
  });

  it("should post apollo-enrichment-credit cost for each person found", async () => {
    await request(app)
      .post("/search")
      .set("X-API-Key", "test-service-secret")
      .set("X-Clerk-Org-Id", "org_test")
      .send({
        runId: "campaign-run-abc",
        personTitles: ["CEO"],
      })
      .expect(200);

    // One addCosts call per person (enrichment) + one for search
    const enrichmentCalls = mockAddCosts.mock.calls.filter(([, items]) =>
      items.some((i: { costName: string }) => i.costName === "apollo-enrichment-credit")
    );

    expect(enrichmentCalls).toHaveLength(MOCK_PEOPLE_COUNT);

    // Each enrichment cost should have quantity 1
    for (const [, items] of enrichmentCalls) {
      const enrichItem = items.find((i: { costName: string }) => i.costName === "apollo-enrichment-credit");
      expect(enrichItem.quantity).toBe(1);
    }
  });

  it("should post apollo-search-credit cost once per search", async () => {
    await request(app)
      .post("/search")
      .set("X-API-Key", "test-service-secret")
      .set("X-Clerk-Org-Id", "org_test")
      .send({
        runId: "campaign-run-abc",
        personTitles: ["CEO"],
      })
      .expect(200);

    const searchCalls = mockAddCosts.mock.calls.filter(([, items]) =>
      items.some((i: { costName: string }) => i.costName === "apollo-search-credit")
    );

    expect(searchCalls).toHaveLength(1);
    const [, items] = searchCalls[0];
    const searchItem = items.find((i: { costName: string }) => i.costName === "apollo-search-credit");
    expect(searchItem.quantity).toBe(1);
  });

  it("should log at error level when enrichment cost tracking fails", async () => {
    // Make createRun succeed but addCosts fail for enrichments
    let createCallCount = 0;
    mockCreateRun.mockImplementation(() => {
      createCallCount++;
      return Promise.resolve({ id: `run-${createCallCount}` });
    });
    mockAddCosts.mockRejectedValue(new Error("Cost name not registered"));

    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await request(app)
      .post("/search")
      .set("X-API-Key", "test-service-secret")
      .set("X-Clerk-Org-Id", "org_test")
      .send({
        runId: "campaign-run-abc",
        personTitles: ["CEO"],
      })
      .expect(200); // Search still succeeds despite cost tracking failure

    // Must log at error level (not warn)
    const costErrorCalls = errorSpy.mock.calls.filter(
      (call) => typeof call[0] === "string" && call[0].includes("COST TRACKING FAILED")
    );
    expect(costErrorCalls.length).toBeGreaterThan(0);

    errorSpy.mockRestore();
  });

  it("should link enrichmentRunId to DB record even when addCosts fails", async () => {
    // This is the critical regression: if addCosts fails, the DB link must
    // still be set so the dashboard can show per-item cost details.
    let createCallCount = 0;
    mockCreateRun.mockImplementation(() => {
      createCallCount++;
      return Promise.resolve({ id: `run-${createCallCount}` });
    });
    mockAddCosts.mockRejectedValue(new Error("Cost name not registered"));

    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await request(app)
      .post("/search")
      .set("X-API-Key", "test-service-secret")
      .set("X-Clerk-Org-Id", "org_test")
      .send({
        runId: "campaign-run-abc",
        personTitles: ["CEO"],
      })
      .expect(200);

    // enrichmentRunId must be set in the DB even though addCosts failed
    const linkCalls = mockDbSetCalls.filter((data) => "enrichmentRunId" in data);
    expect(linkCalls).toHaveLength(MOCK_PEOPLE_COUNT);
    for (const linkCall of linkCalls) {
      expect(linkCall.enrichmentRunId).toBeDefined();
      expect(typeof linkCall.enrichmentRunId).toBe("string");
    }

    errorSpy.mockRestore();
  });

  it("should use exact cost name strings that match runs-service catalog", async () => {
    await request(app)
      .post("/search")
      .set("X-API-Key", "test-service-secret")
      .set("X-Clerk-Org-Id", "org_test")
      .send({
        runId: "campaign-run-abc",
        personTitles: ["CEO"],
      })
      .expect(200);

    const allCostNames = mockAddCosts.mock.calls
      .flatMap(([, items]) => items.map((i: { costName: string }) => i.costName));

    // Only these exact cost names should be used
    const uniqueNames = [...new Set(allCostNames)];
    expect(uniqueNames.sort()).toEqual(["apollo-enrichment-credit", "apollo-search-credit"]);
  });
});
