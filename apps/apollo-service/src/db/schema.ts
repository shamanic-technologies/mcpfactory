import { pgTable, uuid, text, timestamp, uniqueIndex, integer, decimal, jsonb } from "drizzle-orm/pg-core";

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
    campaignRunId: text("campaign_run_id").notNull(), // Reference to campaign_runs in campaign-service
    
    // Request params (for debugging/replay)
    requestParams: jsonb("request_params"),
    
    // Results summary
    peopleCount: integer("people_count").notNull().default(0),
    totalEntries: integer("total_entries").notNull().default(0),
    
    // Cost tracking
    costUsd: decimal("cost_usd", { precision: 10, scale: 4 }).default("0"),
    
    // Raw response (for debugging)
    responseRaw: jsonb("response_raw"),
    
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("idx_searches_org").on(table.orgId),
    uniqueIndex("idx_searches_run").on(table.campaignRunId),
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
    campaignRunId: text("campaign_run_id").notNull(),
    searchId: uuid("search_id")
      .references(() => apolloPeopleSearches.id, { onDelete: "cascade" }),
    
    // Apollo person ID
    apolloPersonId: text("apollo_person_id"),
    
    // Person fields
    firstName: text("first_name"),
    lastName: text("last_name"),
    email: text("email"),
    emailStatus: text("email_status"),  // verified, unverified, etc.
    title: text("title"),
    linkedinUrl: text("linkedin_url"),
    
    // Organization fields
    organizationName: text("organization_name"),
    organizationDomain: text("organization_domain"),
    organizationIndustry: text("organization_industry"),
    organizationSize: text("organization_size"),
    organizationRevenueUsd: decimal("organization_revenue_usd", { precision: 15, scale: 2 }),
    
    // Cost tracking
    costUsd: decimal("cost_usd", { precision: 10, scale: 4 }).default("0"),
    
    // Raw response
    responseRaw: jsonb("response_raw"),
    
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("idx_enrichments_org").on(table.orgId),
    uniqueIndex("idx_enrichments_run").on(table.campaignRunId),
    uniqueIndex("idx_enrichments_email").on(table.email),
  ]
);

export type Org = typeof orgs.$inferSelect;
export type NewOrg = typeof orgs.$inferInsert;
export type ApolloPeopleSearch = typeof apolloPeopleSearches.$inferSelect;
export type NewApolloPeopleSearch = typeof apolloPeopleSearches.$inferInsert;
export type ApolloPeopleEnrichment = typeof apolloPeopleEnrichments.$inferSelect;
export type NewApolloPeopleEnrichment = typeof apolloPeopleEnrichments.$inferInsert;
