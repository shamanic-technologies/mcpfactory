import express from "express";
import cors from "cors";
import healthRoutes from "../../src/routes/health.js";

export function createTestApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use(healthRoutes);
  app.use((req, res) => res.status(404).json({ error: "Not found" }));
  return app;
}

export function getAuthHeaders() {
  return { "X-Service-Secret": "test-service-secret", "Content-Type": "application/json" };
}
