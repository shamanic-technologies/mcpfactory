CREATE TABLE IF NOT EXISTS "apollo_people_enrichments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"campaign_run_id" text NOT NULL,
	"search_id" uuid,
	"apollo_person_id" text,
	"first_name" text,
	"last_name" text,
	"email" text,
	"email_status" text,
	"title" text,
	"linkedin_url" text,
	"organization_name" text,
	"organization_domain" text,
	"organization_industry" text,
	"organization_size" text,
	"organization_revenue_usd" numeric(15, 2),
	"cost_usd" numeric(10, 4) DEFAULT '0',
	"response_raw" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "apollo_people_searches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"campaign_run_id" text NOT NULL,
	"request_params" jsonb,
	"people_count" integer DEFAULT 0 NOT NULL,
	"total_entries" integer DEFAULT 0 NOT NULL,
	"cost_usd" numeric(10, 4) DEFAULT '0',
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
CREATE TABLE IF NOT EXISTS "tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tasks_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tasks_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"org_id" uuid NOT NULL,
	"user_id" uuid,
	"status" text DEFAULT 'running' NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ended_at" timestamp with time zone,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tasks_runs_costs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_run_id" uuid NOT NULL,
	"cost_name" text NOT NULL,
	"units" integer NOT NULL,
	"cost_per_unit_in_usd_cents" numeric(12, 10) NOT NULL,
	"total_cost_in_usd_cents" numeric(12, 10) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
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
 ALTER TABLE "apollo_people_enrichments" ADD CONSTRAINT "apollo_people_enrichments_org_id_orgs_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "apollo_people_enrichments" ADD CONSTRAINT "apollo_people_enrichments_search_id_apollo_people_searches_id_fk" FOREIGN KEY ("search_id") REFERENCES "public"."apollo_people_searches"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "apollo_people_searches" ADD CONSTRAINT "apollo_people_searches_org_id_orgs_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tasks_runs" ADD CONSTRAINT "tasks_runs_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tasks_runs" ADD CONSTRAINT "tasks_runs_org_id_orgs_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tasks_runs" ADD CONSTRAINT "tasks_runs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tasks_runs_costs" ADD CONSTRAINT "tasks_runs_costs_task_run_id_tasks_runs_id_fk" FOREIGN KEY ("task_run_id") REFERENCES "public"."tasks_runs"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_enrichments_org" ON "apollo_people_enrichments" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_enrichments_run" ON "apollo_people_enrichments" USING btree ("campaign_run_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_enrichments_email" ON "apollo_people_enrichments" USING btree ("email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_searches_org" ON "apollo_people_searches" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_searches_run" ON "apollo_people_searches" USING btree ("campaign_run_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_orgs_clerk_id" ON "orgs" USING btree ("clerk_org_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_tasks_runs_task" ON "tasks_runs" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_tasks_runs_org" ON "tasks_runs" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_tasks_runs_status" ON "tasks_runs" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_tasks_runs_costs_run" ON "tasks_runs_costs" USING btree ("task_run_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_tasks_runs_costs_name" ON "tasks_runs_costs" USING btree ("cost_name");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_users_clerk_id" ON "users" USING btree ("clerk_user_id");