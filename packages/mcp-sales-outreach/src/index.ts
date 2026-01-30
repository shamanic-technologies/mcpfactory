#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const server = new Server(
  {
    name: "@mcpfactory/sales-outreach",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Tool definitions
const TOOLS = [
  {
    name: "launch_campaign",
    description:
      "Launch a DFY cold email outreach campaign. Provide a URL and budget, we handle everything else.",
    inputSchema: {
      type: "object" as const,
      properties: {
        target_url: {
          type: "string",
          description: "The URL of the product/service to promote",
        },
        target_audience: {
          type: "string",
          description:
            "Optional: Description of ideal customers (e.g., 'CTOs at tech startups')",
        },
        budget: {
          type: "object",
          properties: {
            max_daily_usd: { type: "number" },
            max_weekly_usd: { type: "number" },
            max_monthly_usd: { type: "number" },
          },
          description: "BYOK budget limits",
        },
        schedule: {
          type: "object",
          properties: {
            frequency: {
              type: "string",
              enum: ["daily", "weekly", "once"],
            },
            trial_days: { type: "number" },
            pause_on_weekend: { type: "boolean" },
          },
        },
        reporting: {
          type: "object",
          properties: {
            frequency: {
              type: "string",
              enum: ["daily", "weekly", "on_completion"],
            },
            email: { type: "string" },
            whatsapp: { type: "string" },
          },
        },
      },
      required: ["target_url"],
    },
  },
  {
    name: "get_campaign_results",
    description: "Get results and stats for a campaign",
    inputSchema: {
      type: "object" as const,
      properties: {
        campaign_id: {
          type: "string",
          description: "The campaign ID",
        },
      },
      required: ["campaign_id"],
    },
  },
  {
    name: "pause_campaign",
    description: "Pause a running campaign",
    inputSchema: {
      type: "object" as const,
      properties: {
        campaign_id: { type: "string" },
      },
      required: ["campaign_id"],
    },
  },
  {
    name: "resume_campaign",
    description: "Resume a paused campaign",
    inputSchema: {
      type: "object" as const,
      properties: {
        campaign_id: { type: "string" },
      },
      required: ["campaign_id"],
    },
  },
  {
    name: "list_campaigns",
    description: "List all your campaigns",
    inputSchema: {
      type: "object" as const,
      properties: {},
    },
  },
  {
    name: "get_stats",
    description:
      "Get your usage stats and community benchmarks for transparency",
    inputSchema: {
      type: "object" as const,
      properties: {},
    },
  },
];

// Handle list tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: TOOLS };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  // WAITLIST MODE: All tools return waitlist message for now
  const waitlistResponse = {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(
          {
            status: "waitlist",
            message:
              "Thanks for your interest in @mcpfactory/sales-outreach! This MCP is currently in development.",
            next_steps: [
              "Join our waitlist at https://mcpfactory.org/waitlist",
              "Star our repo: https://github.com/mcpfactory/mcpfactory",
              "You'll get early access when we launch",
            ],
            your_request: {
              tool: name,
              args: args,
            },
            eta: "Q1 2026",
          },
          null,
          2
        ),
      },
    ],
  };

  switch (name) {
    case "launch_campaign":
    case "get_campaign_results":
    case "pause_campaign":
    case "resume_campaign":
    case "list_campaigns":
    case "get_stats":
      return waitlistResponse;

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("@mcpfactory/sales-outreach MCP server running on stdio");
}

main().catch(console.error);
