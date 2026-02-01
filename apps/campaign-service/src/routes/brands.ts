import { Router } from "express";
import { eq, and } from "drizzle-orm";
import { db } from "../db/index.js";
import { brands, orgs } from "../db/schema.js";
import { clerkAuth, requireOrg, AuthenticatedRequest } from "../middleware/auth.js";
import { extractDomain, normalizeUrl } from "../lib/domain.js";

const router = Router();

/**
 * GET /brands - List all brands for the org
 */
router.get("/brands", clerkAuth, requireOrg, async (req: AuthenticatedRequest, res) => {
  try {
    const orgBrands = await db
      .select()
      .from(brands)
      .innerJoin(orgs, eq(brands.orgId, orgs.id))
      .where(eq(orgs.clerkOrgId, req.clerkOrgId!));

    res.json({
      brands: orgBrands.map((row) => ({
        id: row.brands.id,
        domain: row.brands.domain,
        name: row.brands.name,
        brandUrl: row.brands.brandUrl,
        createdAt: row.brands.createdAt,
        updatedAt: row.brands.updatedAt,
      })),
    });
  } catch (error) {
    console.error("List brands error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /brands/:id - Get a single brand
 */
router.get("/brands/:id", clerkAuth, requireOrg, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    const [brand] = await db
      .select()
      .from(brands)
      .innerJoin(orgs, eq(brands.orgId, orgs.id))
      .where(and(eq(brands.id, id), eq(orgs.clerkOrgId, req.clerkOrgId!)));

    if (!brand) {
      return res.status(404).json({ error: "Brand not found" });
    }

    res.json({
      brand: {
        id: brand.brands.id,
        domain: brand.brands.domain,
        name: brand.brands.name,
        brandUrl: brand.brands.brandUrl,
        createdAt: brand.brands.createdAt,
        updatedAt: brand.brands.updatedAt,
      },
    });
  } catch (error) {
    console.error("Get brand error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /brands - Create a new brand
 */
router.post("/brands", clerkAuth, requireOrg, async (req: AuthenticatedRequest, res) => {
  try {
    const { brandUrl, name } = req.body;

    if (!brandUrl) {
      return res.status(400).json({ error: "brandUrl is required" });
    }

    const normalizedUrl = normalizeUrl(brandUrl);
    const domain = extractDomain(normalizedUrl);

    // Check if brand already exists for this org
    const existing = await db
      .select()
      .from(brands)
      .innerJoin(orgs, eq(brands.orgId, orgs.id))
      .where(and(eq(brands.domain, domain), eq(orgs.clerkOrgId, req.clerkOrgId!)));

    if (existing.length > 0) {
      return res.json({
        brand: {
          id: existing[0].brands.id,
          domain: existing[0].brands.domain,
          name: existing[0].brands.name,
          brandUrl: existing[0].brands.brandUrl,
          createdAt: existing[0].brands.createdAt,
          updatedAt: existing[0].brands.updatedAt,
        },
        created: false,
      });
    }

    // Create new brand
    const [newBrand] = await db
      .insert(brands)
      .values({
        orgId: req.orgId!,
        domain,
        name: name || domain,
        brandUrl: normalizedUrl,
      })
      .returning();

    res.status(201).json({
      brand: {
        id: newBrand.id,
        domain: newBrand.domain,
        name: newBrand.name,
        brandUrl: newBrand.brandUrl,
        createdAt: newBrand.createdAt,
        updatedAt: newBrand.updatedAt,
      },
      created: true,
    });
  } catch (error) {
    console.error("Create brand error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * PATCH /brands/:id - Update a brand
 */
router.patch("/brands/:id", clerkAuth, requireOrg, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    // Verify ownership
    const [existing] = await db
      .select()
      .from(brands)
      .innerJoin(orgs, eq(brands.orgId, orgs.id))
      .where(and(eq(brands.id, id), eq(orgs.clerkOrgId, req.clerkOrgId!)));

    if (!existing) {
      return res.status(404).json({ error: "Brand not found" });
    }

    const [updated] = await db
      .update(brands)
      .set({ name, updatedAt: new Date() })
      .where(eq(brands.id, id))
      .returning();

    res.json({
      brand: {
        id: updated.id,
        domain: updated.domain,
        name: updated.name,
        brandUrl: updated.brandUrl,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
      },
    });
  } catch (error) {
    console.error("Update brand error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * Helper: Get or create brand by brandUrl
 * Used internally when creating campaigns
 */
export async function getOrCreateBrand(
  orgId: string,
  brandUrl: string
): Promise<{ id: string; domain: string; name: string | null; brandUrl: string }> {
  const normalizedUrl = normalizeUrl(brandUrl);
  const domain = extractDomain(normalizedUrl);

  // Check if exists
  const [existing] = await db
    .select()
    .from(brands)
    .where(and(eq(brands.orgId, orgId), eq(brands.domain, domain)));

  if (existing) {
    return {
      id: existing.id,
      domain: existing.domain,
      name: existing.name,
      brandUrl: existing.brandUrl,
    };
  }

  // Create new
  const [newBrand] = await db
    .insert(brands)
    .values({
      orgId,
      domain,
      name: domain,
      brandUrl: normalizedUrl,
    })
    .returning();

  return {
    id: newBrand.id,
    domain: newBrand.domain,
    name: newBrand.name,
    brandUrl: newBrand.brandUrl,
  };
}

export default router;
