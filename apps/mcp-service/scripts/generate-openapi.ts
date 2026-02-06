import { toolDefinitions } from "../src/tools/index.js";
import { writeFileSync } from "fs";
import { zodToJsonSchema } from "zod-to-json-schema";

// Generate OpenAPI spec from MCP tool definitions
// Since mcp-service uses MCP protocol (not REST), we document the tools as virtual endpoints

const paths: Record<string, unknown> = {
  "/health": {
    get: {
      tags: ["System"],
      summary: "Health check",
      responses: {
        "200": {
          description: "Service is healthy",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  status: { type: "string", example: "ok" },
                  service: { type: "string", example: "mcp-service" },
                },
              },
            },
          },
        },
      },
    },
  },
  "/mcp": {
    post: {
      tags: ["MCP"],
      summary: "MCP JSON-RPC endpoint",
      description:
        "Handles MCP protocol requests. Use mcp-session-id header for session management.",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: "header",
          name: "mcp-session-id",
          schema: { type: "string" },
          description: "Session ID (returned after first request)",
        },
      ],
      requestBody: {
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                jsonrpc: { type: "string", example: "2.0" },
                method: { type: "string", example: "tools/call" },
                params: { type: "object" },
                id: { type: "number" },
              },
            },
          },
        },
      },
      responses: {
        "200": { description: "JSON-RPC response" },
      },
    },
    get: {
      tags: ["MCP"],
      summary: "MCP SSE endpoint for server notifications",
      parameters: [
        {
          in: "header",
          name: "mcp-session-id",
          required: true,
          schema: { type: "string" },
        },
      ],
      responses: {
        "200": { description: "SSE stream" },
      },
    },
    delete: {
      tags: ["MCP"],
      summary: "Close MCP session",
      parameters: [
        {
          in: "header",
          name: "mcp-session-id",
          schema: { type: "string" },
        },
      ],
      responses: {
        "200": { description: "Session closed" },
      },
    },
  },
};

// Generate tool documentation as virtual paths
const toolSchemas: Record<string, unknown> = {};

for (const [name, def] of Object.entries(toolDefinitions)) {
  const jsonSchema = zodToJsonSchema(def.schema, name);

  toolSchemas[name] = {
    description: def.description,
    inputSchema: jsonSchema,
  };

  // Also create a virtual path for each tool
  paths[`/mcp/tools/${name}`] = {
    post: {
      tags: ["MCP Tools"],
      summary: def.description,
      description: `MCP Tool: ${name}. Call via JSON-RPC on /mcp with method "tools/call" and params.name="${name}".`,
      requestBody: {
        content: {
          "application/json": {
            schema: jsonSchema.definitions?.[name] || jsonSchema,
          },
        },
      },
      responses: {
        "200": {
          description: "Tool result",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  content: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        type: { type: "string", example: "text" },
                        text: { type: "string" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  };
}

const spec = {
  openapi: "3.0.0",
  info: {
    title: "MCPFactory MCP Service",
    description:
      "MCP (Model Context Protocol) server for MCPFactory. Exposes campaign management tools via MCP protocol over HTTP.",
    version: "0.1.0",
  },
  servers: [
    {
      url: process.env.SERVICE_URL || "https://mcp.mcpfactory.org",
    },
  ],
  security: [{ bearerAuth: [] }],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        description: "MCPFactory API key",
      },
    },
    schemas: toolSchemas,
  },
  paths,
};

writeFileSync("./openapi.json", JSON.stringify(spec, null, 2));
console.log("✅ mcp-service openapi.json generated");
