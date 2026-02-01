-- Remove brands table and brand_id column from campaigns
-- brand-service is now the single source of truth for brands

-- First, drop the foreign key constraint on campaigns.brand_id
ALTER TABLE "campaigns" DROP CONSTRAINT IF EXISTS "campaigns_brand_id_brands_id_fk";

--> statement-breakpoint

-- Drop the brand_id column from campaigns table
ALTER TABLE "campaigns" DROP COLUMN IF EXISTS "brand_id";

--> statement-breakpoint

-- Drop indexes on brands table
DROP INDEX IF EXISTS "idx_brands_org";

--> statement-breakpoint

DROP INDEX IF EXISTS "idx_brands_org_domain";

--> statement-breakpoint

-- Finally, drop the brands table
DROP TABLE IF EXISTS "brands";
