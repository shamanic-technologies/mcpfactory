ALTER TABLE "campaigns" ADD COLUMN "max_budget_total_usd" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "campaigns" DROP COLUMN IF EXISTS "recurrence";
