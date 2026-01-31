import { beforeAll, afterAll } from "vitest";

// Use a mock connection string for tests - integration tests will be skipped if DB not available
process.env.APOLLO_SERVICE_DATABASE_URL =
  process.env.APOLLO_SERVICE_DATABASE_URL || "postgresql://mock:mock@localhost:5432/mock";
process.env.SERVICE_SECRET_KEY = "test-service-secret";

beforeAll(() => console.log("Test suite starting..."));
afterAll(() => console.log("Test suite complete."));
