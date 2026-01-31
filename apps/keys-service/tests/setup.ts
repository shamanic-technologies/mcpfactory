import { beforeAll, afterAll, vi } from "vitest";

vi.mock("@clerk/backend", () => ({
  verifyToken: vi.fn().mockResolvedValue({ sub: "user_test123", org_id: "org_test456" }),
  createClerkClient: vi.fn().mockReturnValue({}),
}));

process.env.CLERK_SECRET_KEY = "test_clerk_secret_key";
process.env.KEYS_SERVICE_DATABASE_URL = process.env.KEYS_SERVICE_DATABASE_URL || "postgresql://test:test@localhost/test";
process.env.ENCRYPTION_KEY = "0123456789abcdef0123456789abcdef";

beforeAll(() => console.log("Test suite starting..."));
afterAll(() => console.log("Test suite complete."));
