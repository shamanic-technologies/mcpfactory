-- Add brands table
CREATE TABLE IF NOT EXISTS "brands" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "org_id" uuid NOT NULL REFERENCES "orgs"("id") ON DELETE CASCADE,
  "domain" text NOT NULL,
  "name" text,
  "brand_url" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "idx_brands_org" ON "brands" ("org_id");
CREATE UNIQUE INDEX IF NOT EXISTS "idx_brands_org_domain" ON "brands" ("org_id", "domain");

-- Add brandId column to campaigns (nullable for migration)
ALTER TABLE "campaigns" ADD COLUMN IF NOT EXISTS "brand_id" uuid REFERENCES "brands"("id") ON DELETE CASCADE;

-- Create index on brandId
CREATE INDEX IF NOT EXISTS "idx_campaigns_brand" ON "campaigns" ("brand_id");
