import { beforeAll, afterAll, vi } from "vitest";
import { migrate } from "drizzle-orm/postgres-js/migrator";

process.env.EMAILGENERATION_SERVICE_DATABASE_URL = process.env.EMAILGENERATION_SERVICE_DATABASE_URL || "postgresql://test:test@localhost/test";
process.env.SERVICE_SECRET_KEY = "test-service-secret";

beforeAll(async () => {
  const { db } = await import("../src/db/index.js");
  await migrate(db, { migrationsFolder: "./drizzle" });
  console.log("Test suite starting...");
});
afterAll(() => console.log("Test suite complete."));
