import { Request, Response, NextFunction } from "express";
import { verifyToken } from "@clerk/backend";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { users, orgs } from "../db/schema.js";

// Re-export users for serviceAuth to use
export { users };

export interface AuthenticatedRequest extends Request {
  userId?: string;
  orgId?: string;
  clerkUserId?: string;
  clerkOrgId?: string;
}

/**
 * Service-to-service auth for internal calls (Railway private network)
 * Uses x-clerk-org-id header to identify org
 * Optionally uses x-clerk-user-id header to identify user
 */
export async function serviceAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const clerkOrgId = req.headers["x-clerk-org-id"] as string;
    const clerkUserId = req.headers["x-clerk-user-id"] as string | undefined;

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

    // Handle optional user context
    if (clerkUserId) {
      let user = await db.query.users.findFirst({
        where: eq(users.clerkUserId, clerkUserId),
      });

      if (!user) {
        const [newUser] = await db
          .insert(users)
          .values({ clerkUserId })
          .returning();
        user = newUser;
      }

      req.userId = user.id;
      req.clerkUserId = clerkUserId;
    }

    next();
  } catch (error) {
    console.error("Service auth error:", error);
    return res.status(401).json({ error: "Service authentication failed" });
  }
}

/**
 * Middleware to authenticate via Clerk JWT
 */
export async function clerkAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing authorization header" });
    }

    const token = authHeader.slice(7);

    const payload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY,
    });
    
    const clerkUserId = payload.sub;
    const clerkOrgId = payload.org_id;

    if (!clerkUserId) {
      return res.status(401).json({ error: "Invalid token" });
    }

    // Find or create user
    let user = await db.query.users.findFirst({
      where: eq(users.clerkUserId, clerkUserId),
    });

    if (!user) {
      const [newUser] = await db
        .insert(users)
        .values({ clerkUserId })
        .returning();
      user = newUser;
    }

    req.userId = user.id;
    req.clerkUserId = clerkUserId;

    // Find or create org if present
    if (clerkOrgId) {
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
    }

    next();
  } catch (error) {
    console.error("Auth error:", error);
    return res.status(401).json({ error: "Authentication failed" });
  }
}

/**
 * Middleware to require org context
 */
export function requireOrg(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  if (!req.orgId) {
    return res.status(400).json({ error: "Organization context required" });
  }
  next();
}
