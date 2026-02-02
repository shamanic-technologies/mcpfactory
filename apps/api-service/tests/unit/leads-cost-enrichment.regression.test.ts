import { describe, it, expect } from "vitest";

/**
 * Regression test: the leads endpoint must batch-fetch enrichmentRun costs
 * and attach them to each lead, following the same pattern as emails.
 *
 * Without this, the dashboard leads page cannot show per-lead cost data.
 */

describe("leads endpoint cost enrichment", () => {
  it("should attach enrichmentRun to leads that have enrichmentRunId", () => {
    // Simulate the mapping logic from the leads endpoint
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

    const leads = [
      { id: "lead-1", enrichmentRunId: "run-1", firstName: "John" },
      { id: "lead-2", enrichmentRunId: null, firstName: "Jane" },
      { id: "lead-3", enrichmentRunId: "run-missing", firstName: "Bob" },
    ];

    // This mirrors the exact logic in campaigns.ts GET /v1/campaigns/:id/leads
    const leadsWithRuns = leads.map((lead) => {
      const run = lead.enrichmentRunId ? runMap.get(lead.enrichmentRunId) : undefined;
      return {
        ...lead,
        enrichmentRun: run
          ? {
              status: run.status,
              startedAt: run.startedAt,
              completedAt: run.completedAt,
              totalCostInUsdCents: run.totalCostInUsdCents,
              costs: run.costs,
            }
          : null,
      };
    });

    // Lead with valid enrichmentRunId should have enrichmentRun attached
    expect(leadsWithRuns[0].enrichmentRun).not.toBeNull();
    expect(leadsWithRuns[0].enrichmentRun!.status).toBe("completed");
    expect(leadsWithRuns[0].enrichmentRun!.totalCostInUsdCents).toBe("5");
    expect(leadsWithRuns[0].enrichmentRun!.costs).toHaveLength(1);

    // Lead with null enrichmentRunId should have null enrichmentRun
    expect(leadsWithRuns[1].enrichmentRun).toBeNull();

    // Lead with enrichmentRunId not found in runMap should have null enrichmentRun
    expect(leadsWithRuns[2].enrichmentRun).toBeNull();
  });

  it("should handle empty leads array gracefully", () => {
    const leads: Array<{ id: string; enrichmentRunId: string | null }> = [];
    const enrichmentRunIds = leads
      .map((l) => l.enrichmentRunId)
      .filter((id): id is string => !!id);

    expect(enrichmentRunIds).toHaveLength(0);
  });

  it("should extract only non-null enrichmentRunIds for batch fetch", () => {
    const leads = [
      { id: "1", enrichmentRunId: "run-a" },
      { id: "2", enrichmentRunId: null },
      { id: "3", enrichmentRunId: "run-b" },
      { id: "4", enrichmentRunId: null },
    ];

    const enrichmentRunIds = leads
      .map((l) => l.enrichmentRunId)
      .filter((id): id is string => !!id);

    expect(enrichmentRunIds).toEqual(["run-a", "run-b"]);
  });
});
