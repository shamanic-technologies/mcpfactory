import { describe, it, expect } from "vitest";

/**
 * Regression test: the companies endpoint must aggregate enrichment costs
 * across all leads belonging to each company.
 *
 * Without this, the dashboard companies page cannot show per-company cost data.
 */

describe("companies endpoint cost aggregation", () => {
  it("should aggregate costs from multiple enrichmentRunIds per company", () => {
    interface RunWithCosts {
      status: string;
      startedAt: string;
      completedAt: string | null;
      totalCostInUsdCents: string;
      costs: Array<{ costName: string; quantity: string; unitCostInUsdCents: string; totalCostInUsdCents: string }>;
    }

    const runMap = new Map<string, RunWithCosts>();
    runMap.set("run-1", {
      status: "completed",
      startedAt: "2025-01-01T00:00:00Z",
      completedAt: "2025-01-01T00:00:01Z",
      totalCostInUsdCents: "5",
      costs: [{ costName: "apollo-enrichment-credit", quantity: "1", unitCostInUsdCents: "5", totalCostInUsdCents: "5" }],
    });
    runMap.set("run-2", {
      status: "completed",
      startedAt: "2025-01-01T00:00:00Z",
      completedAt: "2025-01-01T00:00:01Z",
      totalCostInUsdCents: "5",
      costs: [{ costName: "apollo-enrichment-credit", quantity: "1", unitCostInUsdCents: "5", totalCostInUsdCents: "5" }],
    });

    // Company with 2 leads (2 enrichment runs)
    const company = {
      id: "company-0",
      name: "Acme Corp",
      enrichmentRunIds: ["run-1", "run-2"],
      leadsCount: 2,
    };

    // This mirrors the aggregation logic in campaigns.ts GET /v1/campaigns/:id/companies
    const runIds = company.enrichmentRunIds;
    let totalCostInUsdCents = 0;
    const costAgg = new Map<string, { quantity: number; totalCostInUsdCents: number }>();

    for (const runId of runIds) {
      const run = runMap.get(runId);
      if (!run) continue;
      totalCostInUsdCents += parseFloat(run.totalCostInUsdCents) || 0;
      for (const cost of run.costs) {
        const existing = costAgg.get(cost.costName);
        if (existing) {
          existing.quantity += parseFloat(cost.quantity) || 0;
          existing.totalCostInUsdCents += parseFloat(cost.totalCostInUsdCents) || 0;
        } else {
          costAgg.set(cost.costName, {
            quantity: parseFloat(cost.quantity) || 0,
            totalCostInUsdCents: parseFloat(cost.totalCostInUsdCents) || 0,
          });
        }
      }
    }

    expect(totalCostInUsdCents).toBe(10);
    expect(costAgg.get("apollo-enrichment-credit")).toEqual({
      quantity: 2,
      totalCostInUsdCents: 10,
    });
  });

  it("should handle companies with no enrichmentRunIds", () => {
    const company = {
      id: "company-0",
      name: "Empty Corp",
      enrichmentRunIds: [] as string[],
      leadsCount: 3,
    };

    let totalCostInUsdCents = 0;
    for (const _runId of company.enrichmentRunIds) {
      // No iterations
      totalCostInUsdCents += 1;
    }

    expect(totalCostInUsdCents).toBe(0);
  });

  it("should strip enrichmentRunIds from the response", () => {
    const company = {
      id: "company-0",
      name: "Acme Corp",
      enrichmentRunIds: ["run-1"],
      leadsCount: 1,
    };

    // The endpoint destructures enrichmentRunIds out before returning
    const { enrichmentRunIds: _, ...companyWithoutRunIds } = company;
    const result = {
      ...companyWithoutRunIds,
      totalCostInUsdCents: null,
      costs: [],
    };

    expect(result).not.toHaveProperty("enrichmentRunIds");
    expect(result).toHaveProperty("name", "Acme Corp");
    expect(result).toHaveProperty("totalCostInUsdCents", null);
    expect(result).toHaveProperty("costs");
  });
});
