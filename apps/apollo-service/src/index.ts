// IMPORTANT: Import instrument first to initialize Sentry before anything else
import "./instrument.js";
import * as Sentry from "@sentry/node";
import express from "express";
import cors from "cors";
import healthRoutes from "./routes/health.js";
import searchRoutes from "./routes/search.js";
import referenceRoutes from "./routes/reference.js";

const app = express();
const PORT = process.env.PORT || 3004;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use(healthRoutes);
app.use(searchRoutes);
app.use(referenceRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

// Sentry error handler must be before any other error middleware
Sentry.setupExpressErrorHandler(app);

// Fallback error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

// Listen on :: for Railway private networking (IPv4 & IPv6 support)
app.listen(Number(PORT), "::", () => {
  console.log(`Apollo service running on port ${PORT}`);
});
