import { Router } from "express";
import { externalServices } from "../lib/service-client.js";

const router = Router();

router.get("/health", (req, res) => {
  // #swagger.tags = ['Health']
  // #swagger.summary = 'Health check'
  // #swagger.description = 'Returns service health status'
  res.json({
    status: "ok",
    service: "api-gateway",
    version: "1.0.0",
  });
});

// Debug endpoint to check config (temporary)
router.get("/debug/config", (req, res) => {
  // #swagger.tags = ['Health']
  // #swagger.summary = 'Debug configuration'
  // #swagger.description = 'Returns debug info about external service configuration'
  res.json({
    scraping: {
      url: externalServices.scraping.url,
      hasApiKey: !!externalServices.scraping.apiKey,
      apiKeyLength: externalServices.scraping.apiKey?.length || 0,
    },
    replyQualification: {
      url: externalServices.replyQualification.url,
      hasApiKey: !!externalServices.replyQualification.apiKey,
    },
  });
});

router.get("/", (req, res) => {
  // #swagger.tags = ['Health']
  // #swagger.summary = 'API info'
  // #swagger.description = 'Returns API name, version, and docs URL'
  res.json({
    name: "MCPFactory API",
    version: "1.0.0",
    docs: "https://docs.mcpfactory.org",
  });
});

export default router;
