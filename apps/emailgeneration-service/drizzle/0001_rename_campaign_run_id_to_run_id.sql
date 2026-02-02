-- Rename campaign_run_id to run_id in email_generations table
-- PostgreSQL RENAME COLUMN automatically updates dependent indexes

ALTER TABLE "email_generations" RENAME COLUMN "campaign_run_id" TO "run_id";
