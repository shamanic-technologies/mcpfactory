import { Request, Response, NextFunction } from "express";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { orgs } from "../db/schema.js";

export interface AuthenticatedRequest extends Request {
  orgId?: string;
  clerkOrgId?: string;
}

/**
 * Middleware for internal service calls (no auth - Railway private network)
 */
export async function serviceAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const clerkOrgId = req.headers["x-clerk-org-id"] as string;

    if (!clerkOrgId) {
      return res.status(400).json({ error: "x-clerk-org-id header required" });
    }

    // Find or create org
    let org = await db.query.orgs.findFirst({
      where: eq(orgs.clerkOrgId, clerkOrgId),
    });

    if (!org) {
      const [newOrg] = await db
        .insert(orgs)
        .values({ clerkOrgId })
        .returning();
      org = newOrg;
    }

    req.orgId = org.id;
    req.clerkOrgId = clerkOrgId;
    next();
  } catch (error) {
    console.error("Auth error:", error);
    return res.status(401).json({ error: "Authentication failed" });
  }
}
