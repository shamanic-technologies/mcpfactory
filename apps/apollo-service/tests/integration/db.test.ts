import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "../../src/db/index.js";
import { orgs, apolloPeopleSearches, apolloPeopleEnrichments } from "../../src/db/schema.js";
import { cleanTestData, closeDb, insertTestOrg, insertTestSearch, insertTestEnrichment } from "../helpers/test-db.js";

describe("Apollo Service Database", () => {
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
      expect(found).toBeDefined();
      expect(found?.clerkOrgId).toBe("org_test123");
    });

    it("should enforce unique clerkOrgId", async () => {
      await insertTestOrg({ clerkOrgId: "org_unique" });
      
      await expect(
        insertTestOrg({ clerkOrgId: "org_unique" })
      ).rejects.toThrow();
    });
  });

  describe("apolloPeopleSearches table", () => {
    it("should create a search linked to org", async () => {
      const org = await insertTestOrg();
      const search = await insertTestSearch(org.id, { campaignRunId: "run_123" });
      
      expect(search.id).toBeDefined();
      expect(search.orgId).toBe(org.id);
      expect(search.campaignRunId).toBe("run_123");
    });

    it("should cascade delete when org is deleted", async () => {
      const org = await insertTestOrg();
      const search = await insertTestSearch(org.id);
      
      await db.delete(orgs).where(eq(orgs.id, org.id));
      
      const found = await db.query.apolloPeopleSearches.findFirst({
        where: eq(apolloPeopleSearches.id, search.id),
      });
      expect(found).toBeUndefined();
    });
  });

  describe("apolloPeopleEnrichments table", () => {
    it("should create an enrichment linked to search", async () => {
      const org = await insertTestOrg();
      const search = await insertTestSearch(org.id);
      const enrichment = await insertTestEnrichment(org.id, search.id, {
        email: "lead@company.com",
        firstName: "John",
        lastName: "Doe",
      });
      
      expect(enrichment.id).toBeDefined();
      expect(enrichment.email).toBe("lead@company.com");
      expect(enrichment.firstName).toBe("John");
    });

    it("should cascade delete when search is deleted", async () => {
      const org = await insertTestOrg();
      const search = await insertTestSearch(org.id);
      const enrichment = await insertTestEnrichment(org.id, search.id);
      
      await db.delete(apolloPeopleSearches).where(eq(apolloPeopleSearches.id, search.id));
      
      const found = await db.query.apolloPeopleEnrichments.findFirst({
        where: eq(apolloPeopleEnrichments.id, enrichment.id),
      });
      expect(found).toBeUndefined();
    });
  });
});
