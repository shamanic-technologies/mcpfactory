import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "../../src/db/index.js";
import { orgs, users } from "../../src/db/schema.js";
import { cleanTestData, closeDb, insertTestOrg, insertTestUser } from "../helpers/test-db.js";

describe("Client Service Database", () => {
  beforeEach(async () => {
    await cleanTestData();
  });

  afterAll(async () => {
    await cleanTestData();
    await closeDb();
  });

  describe("orgs table", () => {
    it("should create and query an org", async () => {
      const org = await insertTestOrg({ clerkOrgId: "org_test123" });
      
      expect(org.id).toBeDefined();
      expect(org.clerkOrgId).toBe("org_test123");
      
      const found = await db.query.orgs.findFirst({
        where: eq(orgs.id, org.id),
      });
      expect(found?.clerkOrgId).toBe("org_test123");
    });

    it("should enforce unique clerkOrgId", async () => {
      await insertTestOrg({ clerkOrgId: "org_unique" });
      
      await expect(
        insertTestOrg({ clerkOrgId: "org_unique" })
      ).rejects.toThrow();
    });
  });

  describe("users table", () => {
    it("should create and query a user", async () => {
      const user = await insertTestUser({ clerkUserId: "user_test123" });
      
      expect(user.id).toBeDefined();
      expect(user.clerkUserId).toBe("user_test123");
      
      const found = await db.query.users.findFirst({
        where: eq(users.id, user.id),
      });
      expect(found?.clerkUserId).toBe("user_test123");
    });

    it("should enforce unique clerkUserId", async () => {
      await insertTestUser({ clerkUserId: "user_unique" });
      
      await expect(
        insertTestUser({ clerkUserId: "user_unique" })
      ).rejects.toThrow();
    });
  });
});
