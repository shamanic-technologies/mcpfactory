import { beforeAll, afterAll, vi } from "vitest";

// Mock Clerk before any imports
vi.mock("@clerk/backend", () => ({
  verifyToken: vi.fn().mockResolvedValue({
    sub: "user_test123",
    org_id: "org_test456",
  }),
  createClerkClient: vi.fn().mockReturnValue({
    users: {
      getUser: vi.fn().mockResolvedValue({ id: "user_test123" }),
    },
  }),
}));

// Set test environment variables
process.env.CLERK_SECRET_KEY = "test_clerk_secret_key";
process.env.CLIENT_SERVICE_DATABASE_URL = process.env.CLIENT_SERVICE_DATABASE_URL || "postgresql://test:test@localhost/test";

beforeAll(() => {
  console.log("Test suite starting...");
});

afterAll(() => {
  console.log("Test suite complete.");
});
