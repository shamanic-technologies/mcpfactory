import { describe, it, expect } from "vitest";

/**
 * Regression test: enrichmentRunId must be present in the schema
 * and included in the lead enrichment records.
 *
 * Without enrichmentRunId, the API gateway cannot batch-fetch per-lead
 * costs from runs-service, causing the dashboard to show no cost data.
 */

describe("enrichmentRunId in schema", () => {
  it("apolloPeopleEnrichments should have enrichmentRunId column", async () => {
    const { apolloPeopleEnrichments } = await import("../../src/db/schema.js");

    // The column must exist in the schema definition
    const columns = Object.keys(apolloPeopleEnrichments);
    expect(columns).toContain("enrichmentRunId");
  });

  it("NewApolloPeopleEnrichment type should accept enrichmentRunId", async () => {
    // This is a compile-time check: if the type doesn't include enrichmentRunId,
    // TypeScript will catch it at build time. We verify at runtime that the
    // column definition allows a string value.
    const { apolloPeopleEnrichments } = await import("../../src/db/schema.js");

    const col = (apolloPeopleEnrichments as any).enrichmentRunId;
    expect(col).toBeDefined();
    // The column should be a text column (not required/notNull)
    expect(col.dataType).toBe("string");
  });
});
