DROP TABLE IF EXISTS "tasks_runs_costs" CASCADE;--> statement-breakpoint
DROP TABLE IF EXISTS "tasks_runs" CASCADE;--> statement-breakpoint
DROP TABLE IF EXISTS "tasks" CASCADE;--> statement-breakpoint
ALTER TABLE "apollo_people_enrichments" DROP COLUMN IF EXISTS "cost_usd";--> statement-breakpoint
ALTER TABLE "apollo_people_searches" DROP COLUMN IF EXISTS "cost_usd";