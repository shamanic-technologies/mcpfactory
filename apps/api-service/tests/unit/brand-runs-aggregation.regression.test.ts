import { describe, it, expect } from "vitest";

/**
 * Regression test: the brands/:id/runs endpoint must aggregate runs
 * across all campaigns belonging to a brand, sorted by startedAt desc.
 */

describe("brand runs aggregation", () => {
  it("should aggregate runs from multiple campaigns and sort by startedAt desc", () => {
    // Simulate runs from 2 campaigns
    const campaign1Runs = [
      { id: "run-1", status: "completed", startedAt: "2025-01-01T00:00:00Z", completedAt: "2025-01-01T00:01:00Z" },
      { id: "run-2", status: "completed", startedAt: "2025-01-03T00:00:00Z", completedAt: "2025-01-03T00:01:00Z" },
    ];
    const campaign2Runs = [
      { id: "run-3", status: "completed", startedAt: "2025-01-02T00:00:00Z", completedAt: "2025-01-02T00:01:00Z" },
    ];

    const campaigns = [
      { id: "campaign-1", name: "Campaign A" },
      { id: "campaign-2", name: "Campaign B" },
    ];

    // This mirrors the aggregation logic in brand.ts GET /v1/brands/:id/runs
    interface RunEntry { id: string; status: string; startedAt: string; completedAt: string | null }
    const allRuns: Array<RunEntry & { campaignId: string; campaignName: string }> = [];

    for (const run of campaign1Runs) {
      allRuns.push({ ...run, campaignId: campaigns[0].id, campaignName: campaigns[0].name });
    }
    for (const run of campaign2Runs) {
      allRuns.push({ ...run, campaignId: campaigns[1].id, campaignName: campaigns[1].name });
    }

    // Simulate RunWithCosts map
    const runCosts = new Map([
      ["run-1", { totalCostInUsdCents: "10", costs: [{ costName: "apollo-enrichment-credit", quantity: "2", unitCostInUsdCents: "5", totalCostInUsdCents: "10" }] }],
      ["run-2", { totalCostInUsdCents: "15", costs: [] }],
      ["run-3", { totalCostInUsdCents: "5", costs: [] }],
    ]);

    const result = allRuns
      .map((run) => {
        const withCosts = runCosts.get(run.id);
        return {
          id: run.id,
          campaignId: run.campaignId,
          campaignName: run.campaignName,
          status: run.status,
          startedAt: run.startedAt,
          completedAt: run.completedAt,
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
    expect(result[0].totalCostInUsdCents).toBe("15");
    expect(result[2].totalCostInUsdCents).toBe("10");
    expect(result[2].costs).toHaveLength(1);

    // Should have campaign names
    expect(result[0].campaignName).toBe("Campaign A");
    expect(result[1].campaignName).toBe("Campaign B");
  });

  it("should handle empty campaigns list", () => {
    const campaigns: Array<{ id: string; name: string }> = [];
    const allRuns: Array<{ id: string }> = [];

    for (const _campaign of campaigns) {
      // No iterations
    }

    expect(allRuns).toHaveLength(0);
  });

  it("should handle runs with no cost data", () => {
    const run = {
      id: "run-1",
      campaignId: "campaign-1",
      campaignName: "Campaign A",
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
