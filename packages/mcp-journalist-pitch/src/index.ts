#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const server = new Server(
  {
    name: "@mcpfactory/journalist-pitch",
    version: "0.1.0",
  },
  {
    capabilities: { tools: {} },
  }
);

const TOOLS = [
  {
    name: "launch_campaign",
    description: "Launch a press outreach campaign for your announcement.",
    inputSchema: {
      type: "object" as const,
      properties: {
        target_url: { type: "string", description: "Your company website" },
        announcement: {
          type: "object",
          properties: {
            headline: { type: "string" },
            summary: { type: "string" },
            type: { type: "string", enum: ["funding", "product_launch", "partnership", "milestone", "other"] },
          },
          description: "The announcement to pitch",
        },
        target_publications: {
          type: "array",
          items: { type: "string" },
          description: "Optional: specific publications to target",
        },
        budget: {
          type: "object",
          properties: { max_daily_usd: { type: "number" } },
        },
        reporting: {
          type: "object",
          properties: { email: { type: "string" } },
        },
      },
      required: ["target_url"],
    },
  },
  {
    name: "get_campaign_results",
    description: "Get press outreach results and coverage",
    inputSchema: { type: "object" as const, properties: { campaign_id: { type: "string" } }, required: ["campaign_id"] },
  },
  {
    name: "pause_campaign",
    description: "Pause campaign",
    inputSchema: { type: "object" as const, properties: { campaign_id: { type: "string" } }, required: ["campaign_id"] },
  },
  {
    name: "resume_campaign",
    description: "Resume campaign",
    inputSchema: { type: "object" as const, properties: { campaign_id: { type: "string" } }, required: ["campaign_id"] },
  },
  {
    name: "list_campaigns",
    description: "List campaigns",
    inputSchema: { type: "object" as const, properties: {} },
  },
  {
    name: "get_stats",
    description: "Get usage stats and benchmarks",
    inputSchema: { type: "object" as const, properties: {} },
  },
];

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  return {
    content: [{
      type: "text" as const,
      text: JSON.stringify({
        status: "waitlist",
        message: "Thanks for your interest in @mcpfactory/journalist-pitch! This MCP is in development.",
        next_steps: ["Join waitlist: https://mcpfactory.org/waitlist", "Star repo: https://github.com/mcpfactory/mcpfactory"],
        your_request: { tool: name, args },
        eta: "Q1 2026",
      }, null, 2),
    }],
  };
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("@mcpfactory/journalist-pitch MCP server running");
}

main().catch(console.error);
