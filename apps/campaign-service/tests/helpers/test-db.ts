import { db, sql } from "../../src/db/index.js";
import { orgs, users, campaigns, campaignRuns } from "../../src/db/schema.js";

/**
 * Clean all test data from the database
 */
export async function cleanTestData() {
  await db.delete(campaignRuns);
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
  data: { name?: string; status?: string } = {}
) {
  const [campaign] = await db
    .insert(campaigns)
    .values({
      orgId,
      name: data.name || `Test Campaign ${Date.now()}`,
      status: data.status || "draft",
    })
    .returning();
  return campaign;
}

/**
 * Insert a test campaign run
 */
export async function insertTestCampaignRun(
  campaignId: string,
  orgId: string,
  data: { status?: string } = {}
) {
  const [run] = await db
    .insert(campaignRuns)
    .values({
      campaignId,
      orgId,
      runStartedAt: new Date(),
      status: data.status || "running",
    })
    .returning();
  return run;
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
