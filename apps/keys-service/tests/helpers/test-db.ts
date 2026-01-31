import { db, sql } from "../../src/db/index.js";
import { orgs, users, apiKeys, byokKeys } from "../../src/db/schema.js";

/**
 * Clean all test data from the database
 */
export async function cleanTestData() {
  await db.delete(apiKeys);
  await db.delete(byokKeys);
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
 * Insert a test API key
 */
export async function insertTestApiKey(
  orgId: string,
  data: { keyHash?: string; keyPrefix?: string; name?: string } = {}
) {
  const [key] = await db
    .insert(apiKeys)
    .values({
      orgId,
      keyHash: data.keyHash || `hash-${Date.now()}`,
      keyPrefix: data.keyPrefix || "mcpf_tes",
      name: data.name || "Test Key",
    })
    .returning();
  return key;
}

/**
 * Insert a test BYOK key
 */
export async function insertTestByokKey(
  orgId: string,
  data: { provider?: string; encryptedKey?: string } = {}
) {
  const [key] = await db
    .insert(byokKeys)
    .values({
      orgId,
      provider: data.provider || "apollo",
      encryptedKey: data.encryptedKey || `encrypted-${Date.now()}`,
    })
    .returning();
  return key;
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
