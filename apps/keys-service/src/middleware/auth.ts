import { Request, Response, NextFunction } from "express";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { apiKeys } from "../db/schema.js";
import { hashApiKey } from "../lib/api-key.js";

export interface AuthenticatedRequest extends Request {
  orgId?: string;
}

/**
 * Authenticate via API key (for MCP/external clients)
 * Called by api-service to validate user API keys
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
