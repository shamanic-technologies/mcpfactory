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
    index("idx_searches_org").on(table.orgId),
    index("idx_searches_run").on(table.campaignRunId),
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
    index("idx_enrichments_org").on(table.orgId),
    index("idx_enrichments_run").on(table.campaignRunId),
    index("idx_enrichments_email").on(table.email),
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
export type ApolloPeopleSearch = typeof apolloPeopleSearches.$inferSelect;
export type NewApolloPeopleSearch = typeof apolloPeopleSearches.$inferInsert;
export type ApolloPeopleEnrichment = typeof apolloPeopleEnrichments.$inferSelect;
export type NewApolloPeopleEnrichment = typeof apolloPeopleEnrichments.$inferInsert;
export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
export type TaskRun = typeof tasksRuns.$inferSelect;
export type NewTaskRun = typeof tasksRuns.$inferInsert;
export type TaskRunCost = typeof tasksRunsCosts.$inferSelect;
export type NewTaskRunCost = typeof tasksRunsCosts.$inferInsert;
