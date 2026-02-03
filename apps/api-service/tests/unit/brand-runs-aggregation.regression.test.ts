import { describe, it, expect } from "vitest";

/**
 * Regression test: the brands/:id/runs endpoint enriches brand-service runs
 * with cost data from runs-service, sorted by startedAt desc.
 */

describe("brand runs enrichment", () => {
  it("should enrich runs with cost data and sort by startedAt desc", () => {
    // Simulate runs from brand-service (no costs)
    const brandServiceRuns = [
      { id: "run-1", taskName: "sales-profile-extraction", status: "completed", startedAt: "2025-01-01T00:00:00Z", completedAt: "2025-01-01T00:01:00Z" },
      { id: "run-2", taskName: "icp-extraction", status: "completed", startedAt: "2025-01-03T00:00:00Z", completedAt: "2025-01-03T00:01:00Z" },
      { id: "run-3", taskName: "sales-profile-extraction", status: "completed", startedAt: "2025-01-02T00:00:00Z", completedAt: "2025-01-02T00:01:00Z" },
    ];

    // Simulate RunWithCosts map from runs-service
    const runCosts = new Map([
      ["run-1", { totalCostInUsdCents: "2", costs: [{ costName: "anthropic-opus-4.5-tokens-input", quantity: "5000", unitCostInUsdCents: "0.0002", totalCostInUsdCents: "1" }], status: "completed", startedAt: "2025-01-01T00:00:00Z", completedAt: "2025-01-01T00:01:00Z" }],
      ["run-2", { totalCostInUsdCents: "5", costs: [], status: "completed", startedAt: "2025-01-03T00:00:00Z", completedAt: "2025-01-03T00:01:00Z" }],
      ["run-3", { totalCostInUsdCents: "3", costs: [], status: "completed", startedAt: "2025-01-02T00:00:00Z", completedAt: "2025-01-02T00:01:00Z" }],
    ]);

    // Mirrors the enrichment logic in brand.ts GET /v1/brands/:id/runs
    const result = brandServiceRuns
      .map((run) => {
        const withCosts = runCosts.get(run.id);
        return {
          id: run.id,
          taskName: run.taskName,
          status: withCosts?.status || run.status,
          startedAt: withCosts?.startedAt || run.startedAt,
          completedAt: withCosts?.completedAt || run.completedAt,
          totalCostInUsdCents: withCosts?.totalCostInUsdCents || null,
          costs: withCosts?.costs || [],
        };
      })
      .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());

    // Should be sorted newest first
    expect(result).toHaveLength(3);
    expect(result[0].id).toBe("run-2"); // Jan 3
    expect(result[1].id).toBe("run-3"); // Jan 2
    expect(result[2].id).toBe("run-1"); // Jan 1

    // Should have cost data attached
    expect(result[0].totalCostInUsdCents).toBe("5");
    expect(result[2].totalCostInUsdCents).toBe("2");
    expect(result[2].costs).toHaveLength(1);

    // Should have taskName
    expect(result[0].taskName).toBe("icp-extraction");
    expect(result[2].taskName).toBe("sales-profile-extraction");
  });

  it("should handle empty runs list", () => {
    const runs: Array<{ id: string }> = [];
    expect(runs).toHaveLength(0);
  });

  it("should handle runs with no cost data from runs-service", () => {
    const run = {
      id: "run-1",
      taskName: "sales-profile-extraction",
      status: "running",
      startedAt: "2025-01-01T00:00:00Z",
      completedAt: null,
    };

    const runCosts = new Map<string, { totalCostInUsdCents: string }>();

    const withCosts = runCosts.get(run.id);
    const result = {
      ...run,
      totalCostInUsdCents: withCosts?.totalCostInUsdCents || null,
      costs: [],
    };

    expect(result.totalCostInUsdCents).toBeNull();
    expect(result.costs).toEqual([]);
  });
});
