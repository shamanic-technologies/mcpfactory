-- Migration: Fix email_generations indexes
-- The idx_emailgen_run and idx_emailgen_enrichment were incorrectly created as UNIQUE
-- A campaign run can have MANY email generations (one per lead)
-- An enrichment can have MANY email generations (across different runs)

-- Drop the incorrect unique indexes
DROP INDEX IF EXISTS "idx_emailgen_run";
DROP INDEX IF EXISTS "idx_emailgen_enrichment";

-- Create regular (non-unique) indexes
CREATE INDEX "idx_emailgen_run" ON "email_generations" ("campaign_run_id");
CREATE INDEX "idx_emailgen_enrichment" ON "email_generations" ("apollo_enrichment_id");
