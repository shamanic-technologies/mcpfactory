import { beforeAll, afterAll, vi } from "vitest";

process.env.DATABASE_URL = process.env.EMAILGEN_SERVICE_DATABASE_URL || "postgresql://test:test@localhost/test";
process.env.SERVICE_SECRET_KEY = "test-service-secret";

beforeAll(() => console.log("Test suite starting..."));
afterAll(() => console.log("Test suite complete."));
