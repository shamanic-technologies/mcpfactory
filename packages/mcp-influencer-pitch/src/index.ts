#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const server = new Server(
  {
    name: "@mcpfactory/influencer-pitch",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

const TOOLS = [
  {
    name: "launch_campaign",
    description:
      "Launch a DFY influencer outreach campaign. Find and pitch relevant influencers automatically.",
    inputSchema: {
      type: "object" as const,
      properties: {
        target_url: {
          type: "string",
          description: "The URL of your brand/product",
        },
        niche: {
          type: "string",
          description: "The niche/industry (e.g., 'skincare', 'tech', 'fitness')",
        },
        platforms: {
          type: "array",
          items: { type: "string" },
          description: "Platforms to target (instagram, tiktok, youtube)",
        },
        follower_range: {
          type: "object",
          properties: {
            min: { type: "number" },
            max: { type: "number" },
          },
          description: "Follower count range (e.g., 10K-100K)",
        },
        budget: {
          type: "object",
          properties: {
            max_daily_usd: { type: "number" },
            max_weekly_usd: { type: "number" },
          },
        },
        schedule: {
          type: "object",
          properties: {
            frequency: { type: "string", enum: ["daily", "weekly", "once"] },
            trial_days: { type: "number" },
          },
        },
        reporting: {
          type: "object",
          properties: {
            frequency: { type: "string" },
            email: { type: "string" },
          },
        },
      },
      required: ["target_url"],
    },
  },
  {
    name: "get_campaign_results",
    description: "Get results for an influencer campaign",
    inputSchema: {
      type: "object" as const,
      properties: {
        campaign_id: { type: "string" },
      },
      required: ["campaign_id"],
    },
  },
  {
    name: "pause_campaign",
    description: "Pause a running campaign",
    inputSchema: {
      type: "object" as const,
      properties: { campaign_id: { type: "string" } },
      required: ["campaign_id"],
    },
  },
  {
    name: "resume_campaign",
    description: "Resume a paused campaign",
    inputSchema: {
      type: "object" as const,
      properties: { campaign_id: { type: "string" } },
      required: ["campaign_id"],
    },
  },
  {
    name: "list_campaigns",
    description: "List all your influencer campaigns",
    inputSchema: { type: "object" as const, properties: {} },
  },
  {
    name: "get_stats",
    description: "Get usage stats and community benchmarks",
    inputSchema: { type: "object" as const, properties: {} },
  },
];

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(
          {
            status: "waitlist",
            message: "Thanks for your interest in @mcpfactory/influencer-pitch! This MCP is in development.",
            next_steps: [
              "Join waitlist: https://mcpfactory.org/waitlist",
              "Star repo: https://github.com/mcpfactory/mcpfactory",
            ],
            your_request: { tool: name, args },
            eta: "Q1 2026",
          },
          null,
          2
        ),
      },
    ],
  };
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("@mcpfactory/influencer-pitch MCP server running");
}

main().catch(console.error);
