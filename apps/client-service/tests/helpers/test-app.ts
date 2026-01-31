import express from "express";
import cors from "cors";
import healthRoutes from "../../src/routes/health.js";

/**
 * Create a minimal test Express app instance
 * Uses only health routes to avoid DB dependencies in basic tests
 */
export function createTestApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  // Health routes (no auth required)
  app.use(healthRoutes);

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({ error: "Not found" });
  });

  return app;
}

/**
 * Get auth headers with mock Bearer token
 */
export function getAuthHeaders() {
  return {
    Authorization: "Bearer mock-test-token",
    "Content-Type": "application/json",
  };
}
