import { Router } from "express";

const router = Router();

router.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "api-gateway",
    version: "1.0.0",
  });
});

router.get("/", (req, res) => {
  res.json({
    name: "MCPFactory API",
    version: "1.0.0",
    docs: "https://docs.mcpfactory.org",
  });
});

export default router;
