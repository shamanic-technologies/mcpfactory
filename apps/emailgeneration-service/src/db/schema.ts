import { pgTable, uuid, text, timestamp, uniqueIndex, index, integer, jsonb } from "drizzle-orm/pg-core";

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

// Email generations
export const emailGenerations = pgTable(
  "email_generations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => orgs.id, { onDelete: "cascade" }),
    runId: text("run_id").notNull(),
    apolloEnrichmentId: text("apollo_enrichment_id").notNull(),

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

    // Model info (kept for operational metadata)
    model: text("model").notNull().default("claude-opus-4-5"),
    tokensInput: integer("tokens_input"),
    tokensOutput: integer("tokens_output"),

    // Raw data for debugging
    promptRaw: text("prompt_raw"),
    responseRaw: jsonb("response_raw"),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_emailgen_org").on(table.orgId),
    index("idx_emailgen_run").on(table.runId),
    index("idx_emailgen_enrichment").on(table.apolloEnrichmentId),
  ]
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Org = typeof orgs.$inferSelect;
export type NewOrg = typeof orgs.$inferInsert;
export type EmailGeneration = typeof emailGenerations.$inferSelect;
export type NewEmailGeneration = typeof emailGenerations.$inferInsert;
