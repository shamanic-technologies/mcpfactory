#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const server = new Server(
  {
    name: "@mcpfactory/podcaster-pitch",
    version: "0.1.0",
  },
  {
    capabilities: { tools: {} },
  }
);

const TOOLS = [
  {
    name: "launch_campaign",
    description: "Launch a podcast guest outreach campaign. Get booked on relevant podcasts.",
    inputSchema: {
      type: "object" as const,
      properties: {
        target_url: { type: "string", description: "Your website/LinkedIn URL" },
        topics: {
          type: "array",
          items: { type: "string" },
          description: "Topics you can discuss as a guest",
        },
        podcast_categories: {
          type: "array",
          items: { type: "string" },
          description: "Podcast categories to target (e.g., 'business', 'tech', 'marketing')",
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
    description: "Get podcast outreach results",
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
        message: "Thanks for your interest in @mcpfactory/podcaster-pitch! This MCP is in development.",
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
  console.error("@mcpfactory/podcaster-pitch MCP server running");
}

main().catch(console.error);
