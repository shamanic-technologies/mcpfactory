-- Add brand_id column to campaigns table
-- This references the brand ID from brand-service (not a local FK)
-- Nullable initially, set by worker after brand-upsert completes

ALTER TABLE "campaigns" ADD COLUMN IF NOT EXISTS "brand_id" uuid;

--> statement-breakpoint

-- Index for efficient queries by brand
CREATE INDEX IF NOT EXISTS "idx_campaigns_brand_id" ON "campaigns" ("brand_id");
