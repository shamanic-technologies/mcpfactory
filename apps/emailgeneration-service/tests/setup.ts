import { beforeAll, afterAll, vi } from "vitest";

process.env.EMAILGENERATION_SERVICE_DATABASE_URL = process.env.EMAILGENERATION_SERVICE_DATABASE_URL || "postgresql://test:test@localhost/test";
process.env.SERVICE_SECRET_KEY = "test-service-secret";

beforeAll(() => console.log("Test suite starting..."));
afterAll(() => console.log("Test suite complete."));
