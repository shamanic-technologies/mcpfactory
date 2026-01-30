import { Request, Response, NextFunction } from "express";
import { createClerkClient } from "@clerk/backend";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { users } from "../db/schema.js";
import { generateApiKey } from "../lib/api-key.js";

const clerk = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});

export interface AuthenticatedRequest extends Request {
  userId?: string; // Internal user ID
  clerkUserId?: string;
}

/**
 * Middleware to authenticate via Clerk JWT (for dashboard)
 * Creates user in DB if doesn't exist
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
    const { sub: clerkUserId } = await clerk.verifyToken(token);

    if (!clerkUserId) {
      return res.status(401).json({ error: "Invalid token" });
    }

    // Find or create user
    let user = await db.query.users.findFirst({
      where: eq(users.clerkUserId, clerkUserId),
    });

    if (!user) {
      // Create new user
      const [newUser] = await db
        .insert(users)
        .values({
          clerkUserId,
          apiKey: generateApiKey(),
        })
        .returning();
      user = newUser;
    }

    req.userId = user.id;
    req.clerkUserId = clerkUserId;
    next();
  } catch (error) {
    console.error("Auth error:", error);
    return res.status(401).json({ error: "Authentication failed" });
  }
}

/**
 * Middleware to authenticate via API key (for MCP)
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

    const apiKey = authHeader.slice(7);

    if (!apiKey.startsWith("mcpf_")) {
      return res.status(401).json({ error: "Invalid API key format" });
    }

    const user = await db.query.users.findFirst({
      where: eq(users.apiKey, apiKey),
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid API key" });
    }

    req.userId = user.id;
    req.clerkUserId = user.clerkUserId;
    next();
  } catch (error) {
    console.error("API key auth error:", error);
    return res.status(401).json({ error: "Authentication failed" });
  }
}
