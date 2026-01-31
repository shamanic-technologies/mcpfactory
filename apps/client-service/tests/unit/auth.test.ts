import { describe, it, expect, vi, beforeEach } from "vitest";
import { Request, Response, NextFunction } from "express";

// Mock Clerk before importing auth module
vi.mock("@clerk/backend", () => ({
  verifyToken: vi.fn(),
  createClerkClient: vi.fn().mockReturnValue({}),
}));

import { verifyToken } from "@clerk/backend";

describe("Auth Middleware", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    vi.clearAllMocks();

    mockReq = {
      headers: {},
    };
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
    mockNext = vi.fn();
  });

  describe("requireAuth", () => {
    it("should reject requests without Authorization header", async () => {
      // Import after mocking
      const { requireAuth } = await import("../../src/middleware/auth.js");

      mockReq.headers = {};

      await requireAuth(mockReq as any, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: "Missing authorization header" })
      );
    });

    it("should reject requests with invalid Bearer format", async () => {
      const { requireAuth } = await import("../../src/middleware/auth.js");

      mockReq.headers = { authorization: "Invalid token" };

      await requireAuth(mockReq as any, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    it("should accept valid Bearer token", async () => {
      const { requireAuth } = await import("../../src/middleware/auth.js");

      // Mock successful token verification
      vi.mocked(verifyToken).mockResolvedValueOnce({
        sub: "user_123",
        org_id: "org_456",
      } as any);

      mockReq.headers = { authorization: "Bearer valid-token" };

      await requireAuth(mockReq as any, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect((mockReq as any).userId).toBe("user_123");
      expect((mockReq as any).orgId).toBe("org_456");
    });

    it("should handle token verification errors", async () => {
      const { requireAuth } = await import("../../src/middleware/auth.js");

      // Mock failed token verification
      vi.mocked(verifyToken).mockRejectedValueOnce(new Error("Invalid token"));

      mockReq.headers = { authorization: "Bearer invalid-token" };

      await requireAuth(mockReq as any, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: "Invalid token" })
      );
    });
  });
});
