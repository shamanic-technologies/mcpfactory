import { beforeAll, afterAll, vi } from "vitest";

process.env.REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
process.env.SERVICE_SECRET_KEY = "test-service-secret";

beforeAll(() => console.log("Test suite starting..."));
afterAll(() => console.log("Test suite complete."));
