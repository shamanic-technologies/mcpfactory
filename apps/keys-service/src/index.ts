import express from "express";
import cors from "cors";
import healthRoutes from "./routes/health.js";
import meRoutes from "./routes/me.js";
import keysRoutes from "./routes/keys.js";
import apiKeysRoutes from "./routes/api-keys.js";
import validateRoutes from "./routes/validate.js";

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: [
    "https://dashboard.mcpfactory.org",
    "https://mcpfactory.org",
    "http://localhost:3000",
    "http://localhost:3001",
  ],
  credentials: true,
}));
app.use(express.json());

// Routes
app.use(healthRoutes);
app.use(meRoutes);
app.use(keysRoutes);
app.use(apiKeysRoutes);
app.use(validateRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`Keys service running on port ${PORT}`);
});
