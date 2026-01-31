import { AuthenticatedRequest } from "../middleware/auth.js";

/**
 * Build headers for internal service-to-service calls
 * Convention:
 * - x-clerk-org-id: Always required
 * - x-clerk-user-id: Optional (provided if available)
 */
export function buildInternalHeaders(req: AuthenticatedRequest): Record<string, string> {
  const headers: Record<string, string> = {
    "x-clerk-org-id": req.orgId!,
  };
  if (req.userId) {
    headers["x-clerk-user-id"] = req.userId;
  }
  return headers;
}
