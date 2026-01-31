import { beforeAll, afterAll, vi } from "vitest";

// Mock Clerk
vi.mock("@clerk/backend", () => ({
  verifyToken: vi.fn().mockResolvedValue({
    sub: "user_test123",
    org_id: "org_test456",
  }),
}));

// Mock fetch for service calls
global.fetch = vi.fn().mockResolvedValue({
  ok: true,
  json: () => Promise.resolve({}),
});

process.env.CLERK_SECRET_KEY = "test_clerk_secret_key";
process.env.SERVICE_SECRET_KEY = "test-service-secret";
process.env.KEYS_SERVICE_URL = "http://localhost:3001";
process.env.APOLLO_SERVICE_URL = "http://localhost:3003";
process.env.CAMPAIGN_SERVICE_URL = "http://localhost:3004";
process.env.CLIENT_SERVICE_URL = "http://localhost:3002";

beforeAll(() => console.log("Test suite starting..."));
afterAll(() => console.log("Test suite complete."));
