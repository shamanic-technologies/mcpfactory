import express from "express";
import cors from "cors";
import healthRoutes from "./routes/health.js";
import usersRoutes from "./routes/users.js";
import orgsRoutes from "./routes/orgs.js";

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors({
  origin: [
    "https://dashboard.mcpfactory.org",
    "https://mcpfactory.org",
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",
  ],
  credentials: true,
}));
app.use(express.json());

// Routes
app.use(healthRoutes);
app.use(usersRoutes);
app.use(orgsRoutes);

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
  console.log(`Client service running on port ${PORT}`);
});
