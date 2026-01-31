import * as Sentry from "@sentry/node";
import express from "express";
import cors from "cors";
import healthRoutes from "./routes/health.js";
import generateRoutes from "./routes/generate.js";

// Initialize Sentry
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || "development",
    tracesSampleRate: 0.1,
  });
}

const app = express();
const PORT = process.env.PORT || 3005;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use(healthRoutes);
app.use(generateRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  Sentry.captureException(err);
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

// Listen on :: for Railway private networking (IPv4 & IPv6 support)
app.listen(Number(PORT), "::", () => {
  console.log(`EmailGeneration service running on port ${PORT}`);
});
