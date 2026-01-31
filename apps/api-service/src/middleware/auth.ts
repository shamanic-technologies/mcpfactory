import { Request, Response, NextFunction } from "express";
import { verifyToken } from "@clerk/backend";
import { callService, services } from "../lib/service-client.js";

export interface AuthenticatedRequest extends Request {
  userId?: string;
  orgId?: string;
  authType?: "jwt" | "api_key";
}

/**
 * Authenticate via Clerk JWT or API Key
 * - Bearer token: Clerk JWT (from dashboard)
 * - X-API-Key: API key (from MCP/external clients)
 */
export async function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;
    const apiKey = req.headers["x-api-key"] as string | undefined;

    // Try API Key first (for MCP clients)
    if (apiKey) {
      const validation = await validateApiKey(apiKey);
      if (validation) {
        req.userId = validation.userId;
        req.orgId = validation.orgId;
        req.authType = "api_key";
        return next();
      }
      return res.status(401).json({ error: "Invalid API key" });
    }

    // Try Clerk JWT (for dashboard)
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      
      const payload = await verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY!,
      });

      req.userId = payload.sub;
      req.orgId = payload.org_id;
      req.authType = "jwt";
      return next();
    }

    return res.status(401).json({ error: "Missing authentication" });
  } catch (error) {
    console.error("Auth error:", error);
    return res.status(401).json({ error: "Invalid authentication" });
  }
}

/**
 * Validate API key against keys-service
 */
async function validateApiKey(apiKey: string): Promise<{ userId: string; orgId: string } | null> {
  try {
    const result = await callService<{ valid: boolean; userId?: string; orgId?: string }>(
      services.keys,
      "/api-keys/validate",
      {
        method: "POST",
        body: { apiKey },
      }
    );

    if (result.valid && result.userId && result.orgId) {
      return { userId: result.userId, orgId: result.orgId };
    }
    return null;
  } catch (error) {
    console.error("API key validation error:", error);
    return null;
  }
}

/**
 * Require organization context
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
