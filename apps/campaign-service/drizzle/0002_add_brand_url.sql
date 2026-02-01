-- Add brandUrl column to campaigns table
-- brandUrl is the new source of truth; brandId is deprecated
ALTER TABLE "campaigns" ADD COLUMN "brand_url" text;

--> statement-breakpoint

-- Populate brandUrl from existing brands table for existing campaigns
UPDATE "campaigns" c
SET "brand_url" = b."brand_url"
FROM "brands" b
WHERE c."brand_id" = b."id" AND c."brand_url" IS NULL;

--> statement-breakpoint

-- Change brandId FK to SET NULL on delete (instead of CASCADE)
ALTER TABLE "campaigns" DROP CONSTRAINT IF EXISTS "campaigns_brand_id_brands_id_fk";

--> statement-breakpoint

ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_brand_id_brands_id_fk" 
  FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE SET NULL;
