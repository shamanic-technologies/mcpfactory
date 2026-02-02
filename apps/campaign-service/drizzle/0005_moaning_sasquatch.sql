ALTER TABLE "campaign_runs" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "campaign_runs" CASCADE;--> statement-breakpoint
DROP TABLE IF EXISTS "tasks_runs_costs" CASCADE;--> statement-breakpoint
DROP TABLE IF EXISTS "tasks_runs" CASCADE;--> statement-breakpoint
DROP TABLE IF EXISTS "tasks" CASCADE;