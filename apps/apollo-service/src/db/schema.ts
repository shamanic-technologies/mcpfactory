import { pgTable, uuid, text, timestamp, uniqueIndex, index, integer, decimal, jsonb } from "drizzle-orm/pg-core";

// Local users table (maps to Clerk)
export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    clerkUserId: text("clerk_user_id").notNull().unique(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("idx_users_clerk_id").on(table.clerkUserId),
  ]
);

// Local orgs table (maps to Clerk)
export const orgs = pgTable(
  "orgs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    clerkOrgId: text("clerk_org_id").notNull().unique(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("idx_orgs_clerk_id").on(table.clerkOrgId),
  ]
);

// Apollo people search results
export const apolloPeopleSearches = pgTable(
  "apollo_people_searches",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => orgs.id, { onDelete: "cascade" }),
    runId: text("run_id").notNull(), // Reference to runs-service run ID

    // Request params (for debugging/replay)
    requestParams: jsonb("request_params"),

    // Results summary
    peopleCount: integer("people_count").notNull().default(0),
    totalEntries: integer("total_entries").notNull().default(0),

    // Raw response (for debugging)
    responseRaw: jsonb("response_raw"),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_searches_org").on(table.orgId),
    index("idx_searches_run").on(table.runId),
  ]
);

// Apollo people enrichments (individual lead data)
export const apolloPeopleEnrichments = pgTable(
  "apollo_people_enrichments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => orgs.id, { onDelete: "cascade" }),
    runId: text("run_id").notNull(),
    searchId: uuid("search_id")
      .references(() => apolloPeopleSearches.id, { onDelete: "cascade" }),

    // Apollo person ID
    apolloPersonId: text("apollo_person_id"),

    // Person fields
    firstName: text("first_name"),
    lastName: text("last_name"),
    email: text("email"),
    emailStatus: text("email_status"),
    title: text("title"),
    linkedinUrl: text("linkedin_url"),

    // Organization fields
    organizationName: text("organization_name"),
    organizationDomain: text("organization_domain"),
    organizationIndustry: text("organization_industry"),
    organizationSize: text("organization_size"),
    organizationRevenueUsd: decimal("organization_revenue_usd", { precision: 15, scale: 2 }),

    // Raw response
    responseRaw: jsonb("response_raw"),

    // Link to runs-service enrichment run for cost tracking
    enrichmentRunId: text("enrichment_run_id"),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_enrichments_org").on(table.orgId),
    index("idx_enrichments_run").on(table.runId),
    index("idx_enrichments_email").on(table.email),
  ]
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Org = typeof orgs.$inferSelect;
export type NewOrg = typeof orgs.$inferInsert;
export type ApolloPeopleSearch = typeof apolloPeopleSearches.$inferSelect;
export type NewApolloPeopleSearch = typeof apolloPeopleSearches.$inferInsert;
export type ApolloPeopleEnrichment = typeof apolloPeopleEnrichments.$inferSelect;
export type NewApolloPeopleEnrichment = typeof apolloPeopleEnrichments.$inferInsert;
