import { db, sql } from "../../src/db/index.js";
import { orgs, apolloPeopleSearches, apolloPeopleEnrichments } from "../../src/db/schema.js";

/**
 * Clean all test data from the database
 */
export async function cleanTestData() {
  await db.delete(apolloPeopleEnrichments);
  await db.delete(apolloPeopleSearches);
  await db.delete(orgs);
}

/**
 * Insert a test org
 */
export async function insertTestOrg(data: { clerkOrgId?: string } = {}) {
  const [org] = await db
    .insert(orgs)
    .values({
      clerkOrgId: data.clerkOrgId || `test-org-${Date.now()}`,
    })
    .returning();
  return org;
}

/**
 * Insert a test people search
 */
export async function insertTestSearch(orgId: string, data: { runId?: string } = {}) {
  const [search] = await db
    .insert(apolloPeopleSearches)
    .values({
      orgId,
      runId: data.runId || `test-run-${Date.now()}`,
      peopleCount: 0,
      totalEntries: 0,
    })
    .returning();
  return search;
}

/**
 * Insert a test enrichment
 */
export async function insertTestEnrichment(
  orgId: string,
  searchId: string,
  data: { email?: string; firstName?: string; lastName?: string } = {}
) {
  const [enrichment] = await db
    .insert(apolloPeopleEnrichments)
    .values({
      orgId,
      runId: `test-run-${Date.now()}`,
      searchId,
      email: data.email || `test-${Date.now()}@example.com`,
      firstName: data.firstName || "Test",
      lastName: data.lastName || "User",
    })
    .returning();
  return enrichment;
}

/**
 * Close database connection
 */
export async function closeDb() {
  await sql.end();
}

/**
 * Generate a random UUID
 */
export function randomId(): string {
  return crypto.randomUUID();
}
