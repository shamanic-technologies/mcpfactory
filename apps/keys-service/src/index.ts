import express from "express";
import cors from "cors";
import healthRoutes from "./routes/health.js";
import internalRoutes from "./routes/internal.js";
import validateRoutes from "./routes/validate.js";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Health check (public)
app.use(healthRoutes);

// API key validation (called by api-service with API key in header)
app.use(validateRoutes);

// Internal routes (service-to-service with X-Service-Secret)
app.use("/internal", internalRoutes);

// 404
app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Error:", err);
  res.status(500).json({ error: "Internal server error" });
});

// Listen on :: for Railway private networking (IPv4 & IPv6 support)
app.listen(Number(PORT), "::", () => {
  console.log(`Keys service running on port ${PORT}`);
});
