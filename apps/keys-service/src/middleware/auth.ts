import { Request, Response, NextFunction } from "express";
import { verifyToken } from "@clerk/backend";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { users, orgs, apiKeys } from "../db/schema.js";
import { hashApiKey } from "../lib/api-key.js";

export interface AuthenticatedRequest extends Request {
  userId?: string;      // Internal user ID
  orgId?: string;       // Internal org ID
  clerkUserId?: string;
  clerkOrgId?: string;
}

/**
 * Middleware to authenticate via Clerk JWT (for dashboard)
 * Creates user/org in DB if doesn't exist
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

    // Verify Clerk JWT
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

/**
 * Middleware to authenticate via API key (for MCP/external)
 */
export async function apiKeyAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing authorization header" });
    }

    const key = authHeader.slice(7);

    if (!key.startsWith("mcpf_")) {
      return res.status(401).json({ error: "Invalid API key format" });
    }

    const keyHash = hashApiKey(key);
    
    const apiKey = await db.query.apiKeys.findFirst({
      where: eq(apiKeys.keyHash, keyHash),
    });

    if (!apiKey) {
      return res.status(401).json({ error: "Invalid API key" });
    }

    // Update last used
    await db
      .update(apiKeys)
      .set({ lastUsedAt: new Date() })
      .where(eq(apiKeys.id, apiKey.id));

    req.orgId = apiKey.orgId;
    next();
  } catch (error) {
    console.error("API key auth error:", error);
    return res.status(401).json({ error: "Authentication failed" });
  }
}
