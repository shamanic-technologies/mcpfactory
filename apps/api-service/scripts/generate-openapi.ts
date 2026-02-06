import swaggerAutogen from "swagger-autogen";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, "..");

const doc = {
  info: {
    title: "MCPFactory API Service",
    description:
      "API Gateway for MCPFactory. Handles authentication, proxies to internal services, and exposes the public REST API.",
    version: "1.0.0",
  },
  host: process.env.SERVICE_URL || "https://api.mcpfactory.org",
  basePath: "/",
  schemes: ["https"],
  securityDefinitions: {
    bearerAuth: {
      type: "apiKey" as const,
      in: "header" as const,
      name: "Authorization",
      description: "Bearer JWT from Clerk or API key (Bearer <token>)",
    },
    apiKey: {
      type: "apiKey" as const,
      in: "header" as const,
      name: "X-API-Key",
      description: "API key for service-to-service communication",
    },
  },
};

const outputFile = join(projectRoot, "openapi.json");
const routes = [join(projectRoot, "src/index.ts")];

swaggerAutogen({ openapi: "3.0.0" })(outputFile, routes, doc).then(() => {
  console.log("✅ api-service openapi.json generated");
});
