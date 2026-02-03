import { db, sql } from "../../src/db/index.js";
import { orgs, users, campaigns } from "../../src/db/schema.js";

/**
 * Clean all test data from the database
 */
export async function cleanTestData() {
  await db.delete(campaigns);
  await db.delete(users);
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
 * Insert a test user
 */
export async function insertTestUser(data: { clerkUserId?: string } = {}) {
  const [user] = await db
    .insert(users)
    .values({
      clerkUserId: data.clerkUserId || `test-user-${Date.now()}`,
    })
    .returning();
  return user;
}

/**
 * Insert a test campaign
 */
export async function insertTestCampaign(
  orgId: string,
  data: {
    name?: string;
    status?: string;
    maxBudgetDailyUsd?: string;
    maxBudgetTotalUsd?: string;
    personTitles?: string[];
    organizationLocations?: string[];
  } = {}
) {
  const [campaign] = await db
    .insert(campaigns)
    .values({
      orgId,
      name: data.name || `Test Campaign ${Date.now()}`,
      status: data.status || "ongoing",
      maxBudgetDailyUsd: data.maxBudgetDailyUsd || "10.00",
      maxBudgetTotalUsd: data.maxBudgetTotalUsd,
      personTitles: data.personTitles,
      organizationLocations: data.organizationLocations,
    })
    .returning();
  return campaign;
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
