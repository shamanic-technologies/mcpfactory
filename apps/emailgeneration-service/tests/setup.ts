import { beforeAll, afterAll, vi } from "vitest";

process.env.EMAILGENERATION_SERVICE_DATABASE_URL = process.env.EMAILGENERATION_SERVICE_DATABASE_URL || "postgresql://test:test@localhost/test";
process.env.SERVICE_SECRET_KEY = "test-service-secret";

beforeAll(async () => {
  // Only run migrations for integration tests (when a real DB is available)
  if (process.env.EMAILGENERATION_SERVICE_DATABASE_URL && !process.env.EMAILGENERATION_SERVICE_DATABASE_URL.includes("localhost/test")) {
    const { migrate } = await import("drizzle-orm/postgres-js/migrator");
    const { db } = await import("../src/db/index.js");
    await migrate(db, { migrationsFolder: "./drizzle" });
  }
  console.log("Test suite starting...");
});
afterAll(() => console.log("Test suite complete."));
