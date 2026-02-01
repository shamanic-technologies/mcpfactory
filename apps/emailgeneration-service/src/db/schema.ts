import { pgTable, uuid, text, timestamp, uniqueIndex, index, integer, decimal, jsonb, numeric } from "drizzle-orm/pg-core";

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
    model: text("model").notNull().default("claude-opus-4-5"),
    tokensInput: integer("tokens_input"),
    tokensOutput: integer("tokens_output"),
    costUsd: decimal("cost_usd", { precision: 10, scale: 6 }),
    
    // Raw data for debugging
    promptRaw: text("prompt_raw"),
    responseRaw: jsonb("response_raw"),
    
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_emailgen_org").on(table.orgId),
    index("idx_emailgen_run").on(table.campaignRunId),
    index("idx_emailgen_enrichment").on(table.apolloEnrichmentId),
  ]
);

// Task type registry
export const tasks = pgTable(
  "tasks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull().unique(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  }
);

// Task runs (individual executions)
export const tasksRuns = pgTable(
  "tasks_runs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    taskId: uuid("task_id")
      .notNull()
      .references(() => tasks.id),
    orgId: uuid("org_id")
      .notNull()
      .references(() => orgs.id),
    userId: uuid("user_id")
      .references(() => users.id),
    status: text("status").notNull().default("running"), // running, completed, failed
    startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
    endedAt: timestamp("ended_at", { withTimezone: true }),
    error: text("error"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_tasks_runs_task").on(table.taskId),
    index("idx_tasks_runs_org").on(table.orgId),
    index("idx_tasks_runs_status").on(table.status),
  ]
);

// Cost line items per task run
export const tasksRunsCosts = pgTable(
  "tasks_runs_costs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    taskRunId: uuid("task_run_id")
      .notNull()
      .references(() => tasksRuns.id, { onDelete: "cascade" }),
    costName: text("cost_name").notNull(),
    units: integer("units").notNull(),
    costPerUnitInUsdCents: numeric("cost_per_unit_in_usd_cents", { precision: 12, scale: 10 }).notNull(),
    totalCostInUsdCents: numeric("total_cost_in_usd_cents", { precision: 12, scale: 10 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_tasks_runs_costs_run").on(table.taskRunId),
    index("idx_tasks_runs_costs_name").on(table.costName),
  ]
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Org = typeof orgs.$inferSelect;
export type NewOrg = typeof orgs.$inferInsert;
export type EmailGeneration = typeof emailGenerations.$inferSelect;
export type NewEmailGeneration = typeof emailGenerations.$inferInsert;
export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
export type TaskRun = typeof tasksRuns.$inferSelect;
export type NewTaskRun = typeof tasksRuns.$inferInsert;
export type TaskRunCost = typeof tasksRunsCosts.$inferSelect;
export type NewTaskRunCost = typeof tasksRunsCosts.$inferInsert;
