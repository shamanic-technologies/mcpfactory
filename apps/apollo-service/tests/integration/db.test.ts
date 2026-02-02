import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Database schema tests using mocks
 * These tests validate the expected behavior of database operations
 * without requiring a real database connection
 */

// Mock data
const mockOrg = { id: "org-uuid-1", clerkOrgId: "org_test123", createdAt: new Date() };
const mockSearch = {
  id: "search-uuid-1",
  orgId: "org-uuid-1",
  runId: "run_123",
  peopleCount: 10,
  totalEntries: 100,
  createdAt: new Date(),
};
const mockEnrichment = {
  id: "enrichment-uuid-1",
  orgId: "org-uuid-1",
  searchId: "search-uuid-1",
  runId: "run_123",
  email: "lead@company.com",
  firstName: "John",
  lastName: "Doe",
  createdAt: new Date(),
};

// In-memory store for mock
let mockStore: {
  orgs: typeof mockOrg[];
  searches: typeof mockSearch[];
  enrichments: typeof mockEnrichment[];
};

beforeEach(() => {
  mockStore = { orgs: [], searches: [], enrichments: [] };
});

// Mock database operations
const mockDb = {
  insert: (table: string) => ({
    values: (data: Record<string, unknown>) => ({
      returning: async () => {
        const id = `${table}-uuid-${Date.now()}`;
        const record = { ...data, id, createdAt: new Date() };
        if (table === "orgs") {
          // Check for unique constraint
          if (mockStore.orgs.find((o) => o.clerkOrgId === data.clerkOrgId)) {
            throw new Error("unique constraint violation");
          }
          mockStore.orgs.push(record as typeof mockOrg);
        } else if (table === "searches") {
          mockStore.searches.push(record as typeof mockSearch);
        } else if (table === "enrichments") {
          mockStore.enrichments.push(record as typeof mockEnrichment);
        }
        return [record];
      },
    }),
  }),
  delete: (table: string) => ({
    where: async (condition: { id: string }) => {
      if (table === "orgs") {
        const orgId = condition.id;
        mockStore.orgs = mockStore.orgs.filter((o) => o.id !== orgId);
        // Cascade delete searches
        const searchIds = mockStore.searches.filter((s) => s.orgId === orgId).map((s) => s.id);
        mockStore.searches = mockStore.searches.filter((s) => s.orgId !== orgId);
        // Cascade delete enrichments
        mockStore.enrichments = mockStore.enrichments.filter((e) => !searchIds.includes(e.searchId));
      } else if (table === "searches") {
        const searchId = condition.id;
        mockStore.searches = mockStore.searches.filter((s) => s.id !== searchId);
        // Cascade delete enrichments
        mockStore.enrichments = mockStore.enrichments.filter((e) => e.searchId !== searchId);
      }
    },
  }),
  query: {
    orgs: {
      findFirst: async ({ where }: { where: { id: string } }) => mockStore.orgs.find((o) => o.id === where.id),
    },
    searches: {
      findFirst: async ({ where }: { where: { id: string } }) => mockStore.searches.find((s) => s.id === where.id),
    },
    enrichments: {
      findFirst: async ({ where }: { where: { id: string } }) => mockStore.enrichments.find((e) => e.id === where.id),
    },
  },
};

describe("Apollo Service Database Schema", () => {
  describe("orgs table", () => {
    it("should create and query an org", async () => {
      const [org] = await mockDb.insert("orgs").values({ clerkOrgId: "org_test123" }).returning();

      expect(org.id).toBeDefined();
      expect(org.clerkOrgId).toBe("org_test123");

      const found = await mockDb.query.orgs.findFirst({ where: { id: org.id } });
      expect(found).toBeDefined();
      expect(found?.clerkOrgId).toBe("org_test123");
    });

    it("should enforce unique clerkOrgId", async () => {
      await mockDb.insert("orgs").values({ clerkOrgId: "org_unique" }).returning();

      await expect(mockDb.insert("orgs").values({ clerkOrgId: "org_unique" }).returning()).rejects.toThrow(
        "unique constraint violation"
      );
    });
  });

  describe("apolloPeopleSearches table", () => {
    it("should create a search linked to org", async () => {
      const [org] = await mockDb.insert("orgs").values({ clerkOrgId: "test-org" }).returning();
      const [search] = await mockDb
        .insert("searches")
        .values({ orgId: org.id, runId: "run_123", peopleCount: 0, totalEntries: 0 })
        .returning();

      expect(search.id).toBeDefined();
      expect(search.orgId).toBe(org.id);
      expect(search.runId).toBe("run_123");
    });

    it("should cascade delete when org is deleted", async () => {
      const [org] = await mockDb.insert("orgs").values({ clerkOrgId: "test-org-cascade" }).returning();
      const [search] = await mockDb
        .insert("searches")
        .values({ orgId: org.id, runId: "run_cascade", peopleCount: 0, totalEntries: 0 })
        .returning();

      await mockDb.delete("orgs").where({ id: org.id });

      const found = await mockDb.query.searches.findFirst({ where: { id: search.id } });
      expect(found).toBeUndefined();
    });
  });

  describe("apolloPeopleEnrichments table", () => {
    it("should create an enrichment linked to search", async () => {
      const [org] = await mockDb.insert("orgs").values({ clerkOrgId: "test-org-enrich" }).returning();
      const [search] = await mockDb
        .insert("searches")
        .values({ orgId: org.id, runId: "run_enrich", peopleCount: 0, totalEntries: 0 })
        .returning();
      const [enrichment] = await mockDb
        .insert("enrichments")
        .values({
          orgId: org.id,
          searchId: search.id,
          runId: "run_enrich",
          email: "lead@company.com",
          firstName: "John",
          lastName: "Doe",
        })
        .returning();

      expect(enrichment.id).toBeDefined();
      expect(enrichment.email).toBe("lead@company.com");
      expect(enrichment.firstName).toBe("John");
    });

    it("should cascade delete when search is deleted", async () => {
      const [org] = await mockDb.insert("orgs").values({ clerkOrgId: "test-org-cascade-search" }).returning();
      const [search] = await mockDb
        .insert("searches")
        .values({ orgId: org.id, runId: "run_cascade_search", peopleCount: 0, totalEntries: 0 })
        .returning();
      const [enrichment] = await mockDb
        .insert("enrichments")
        .values({
          orgId: org.id,
          searchId: search.id,
          runId: "run_cascade_search",
          email: "test@test.com",
          firstName: "Test",
          lastName: "User",
        })
        .returning();

      await mockDb.delete("searches").where({ id: search.id });

      const found = await mockDb.query.enrichments.findFirst({ where: { id: enrichment.id } });
      expect(found).toBeUndefined();
    });
  });
});
