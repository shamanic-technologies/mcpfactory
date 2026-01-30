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

// Email generations
export const emailGenerations = pgTable(
  "email_generations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => orgs.id, { onDelete: "cascade" }),
    campaignRunId: text("campaign_run_id").notNull(),
    apolloEnrichmentId: text("apollo_enrichment_id").notNull(), // Reference to apollo-service
    
    // Lead info (for context)
    leadFirstName: text("lead_first_name"),
    leadLastName: text("lead_last_name"),
    leadCompany: text("lead_company"),
    leadTitle: text("lead_title"),
    
    // Client info (for context)
    clientCompanyName: text("client_company_name"),
    clientCompanyDescription: text("client_company_description"),
    
    // Generated email
    subject: text("subject"),
    bodyHtml: text("body_html"),
    bodyText: text("body_text"),
    
    // Model info
    model: text("model").notNull().default("claude-3-haiku-20240307"),
    tokensInput: integer("tokens_input"),
    tokensOutput: integer("tokens_output"),
    costUsd: decimal("cost_usd", { precision: 10, scale: 6 }),
    
    // Raw data for debugging
    promptRaw: text("prompt_raw"),
    responseRaw: jsonb("response_raw"),
    
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("idx_emailgen_org").on(table.orgId),
    uniqueIndex("idx_emailgen_run").on(table.campaignRunId),
    uniqueIndex("idx_emailgen_enrichment").on(table.apolloEnrichmentId),
  ]
);

export type Org = typeof orgs.$inferSelect;
export type NewOrg = typeof orgs.$inferInsert;
export type EmailGeneration = typeof emailGenerations.$inferSelect;
export type NewEmailGeneration = typeof emailGenerations.$inferInsert;
