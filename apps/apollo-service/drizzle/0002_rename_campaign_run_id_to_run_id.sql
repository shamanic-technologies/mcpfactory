-- Rename campaign_run_id to run_id in apollo tables
-- PostgreSQL RENAME COLUMN automatically updates dependent indexes

ALTER TABLE "apollo_people_searches" RENAME COLUMN "campaign_run_id" TO "run_id";
ALTER TABLE "apollo_people_enrichments" RENAME COLUMN "campaign_run_id" TO "run_id";
