DROP TABLE IF EXISTS "tasks_runs_costs" CASCADE;--> statement-breakpoint
DROP TABLE IF EXISTS "tasks_runs" CASCADE;--> statement-breakpoint
DROP TABLE IF EXISTS "tasks" CASCADE;--> statement-breakpoint
ALTER TABLE "email_generations" DROP COLUMN IF EXISTS "cost_usd";--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "email_generations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"campaign_run_id" text NOT NULL,
	"apollo_enrichment_id" text NOT NULL,
	"lead_first_name" text,
	"lead_last_name" text,
	"lead_company" text,
	"lead_title" text,
	"client_company_name" text,
	"client_company_description" text,
	"subject" text,
	"body_html" text,
	"body_text" text,
	"model" text DEFAULT 'claude-opus-4-5' NOT NULL,
	"tokens_input" integer,
	"tokens_output" integer,
	"prompt_raw" text,
	"response_raw" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "orgs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clerk_org_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "orgs_clerk_org_id_unique" UNIQUE("clerk_org_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clerk_user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_clerk_user_id_unique" UNIQUE("clerk_user_id")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "email_generations" ADD CONSTRAINT "email_generations_org_id_orgs_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_emailgen_org" ON "email_generations" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_emailgen_run" ON "email_generations" USING btree ("campaign_run_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_emailgen_enrichment" ON "email_generations" USING btree ("apollo_enrichment_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_orgs_clerk_id" ON "orgs" USING btree ("clerk_org_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_users_clerk_id" ON "users" USING btree ("clerk_user_id");