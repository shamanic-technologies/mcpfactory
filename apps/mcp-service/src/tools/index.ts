import { z } from "zod";
import { getConfigStatus, callApi } from "../lib/api-client.js";

// Tool definitions with Zod schemas
export const toolDefinitions = {
  mcpfactory_status: {
    description: "Check MCPFactory connection status and configuration",
    schema: z.object({}),
  },
  mcpfactory_create_campaign: {
    description: "Create and immediately start a cold email campaign targeting specific leads. Campaign starts in 'ongoing' status.",
    schema: z.object({
      name: z.string().describe("Campaign name"),
      brand_url: z.string().describe("Your brand/company URL to promote"),
      target_titles: z.array(z.string()).describe("Job titles to target"),
      target_industries: z.array(z.string()).optional().describe("Industries to target"),
      target_locations: z.array(z.string()).optional().describe("Locations to target"),
      recurrence: z.enum(["oneoff", "daily", "weekly", "monthly"]).describe("How often to run: oneoff (single run), daily, weekly, or monthly"),
      max_daily_budget_usd: z.number().optional().describe("Maximum daily spend in USD (at least one budget required)"),
      max_weekly_budget_usd: z.number().optional().describe("Maximum weekly spend in USD"),
      max_monthly_budget_usd: z.number().optional().describe("Maximum monthly spend in USD"),
      end_date: z.string().optional().describe("Optional campaign end date (ISO format)"),
      // Coming soon: reporting frequency
      // reporting: z.enum(["none", "daily", "weekly", "monthly"]).describe("How often to receive campaign reports"),
    }),
  },
  mcpfactory_list_campaigns: {
    description: "List all your cold email campaigns",
    schema: z.object({
      status: z.enum(["ongoing", "stopped", "all"]).optional().describe("Filter by campaign status"),
    }),
  },
  mcpfactory_stop_campaign: {
    description: "Stop a running campaign",
    schema: z.object({
      campaign_id: z.string().describe("Campaign ID to stop"),
    }),
  },
  mcpfactory_resume_campaign: {
    description: "Resume a stopped campaign",
    schema: z.object({
      campaign_id: z.string().describe("Campaign ID to resume"),
    }),
  },
  mcpfactory_campaign_stats: {
    description: "Get statistics for a specific campaign",
    schema: z.object({
      campaign_id: z.string().describe("Campaign ID to get stats for"),
    }),
  },
  mcpfactory_campaign_debug: {
    description: "Get detailed debug info for a campaign: status, all runs, errors, and pipeline state",
    schema: z.object({
      campaign_id: z.string().describe("Campaign ID to debug"),
    }),
  },
  mcpfactory_suggest_icp: {
    description:
      "Analyze a brand's website and suggest an Ideal Customer Profile (ICP) with Apollo-compatible search parameters. Use this when the user doesn't know who to target and wants AI-generated targeting suggestions. Returns person_titles, q_organization_keyword_tags, and organization_locations that can be fed directly into mcpfactory_create_campaign.",
    schema: z.object({
      brand_url: z.string().describe("The brand/company URL to analyze for ICP extraction"),
    }),
  },
};

// Tool handlers
export async function handleToolCall(
  name: string,
  args: Record<string, unknown>
): Promise<unknown> {
  switch (name) {
    case "mcpfactory_status":
      return handleStatus();

    case "mcpfactory_create_campaign":
      return handleCreateCampaign(args);

    case "mcpfactory_list_campaigns":
      return handleListCampaigns(args);

    case "mcpfactory_campaign_stats":
      return handleCampaignStats(args);

    case "mcpfactory_campaign_debug":
      return handleCampaignDebug(args);

    case "mcpfactory_stop_campaign":
      return handleStopCampaign(args);

    case "mcpfactory_resume_campaign":
      return handleResumeCampaign(args);

    case "mcpfactory_suggest_icp":
      return handleSuggestIcp(args);

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

// Handler implementations
async function handleStatus() {
  const status = getConfigStatus();
  
  if (!status.configured) {
    return {
      status: "not_configured",
      message: "MCPFactory API key not configured",
      instructions: [
        "1. Get your API key at https://dashboard.mcpfactory.org/settings/api",
        "2. Set MCPFACTORY_API_KEY environment variable",
        "3. Restart the MCP server",
      ],
    };
  }

  // Check API connectivity
  const result = await callApi("/v1/me");
  
  if (result.error) {
    return {
      status: "error",
      message: result.error,
      apiUrl: status.apiUrl,
    };
  }

  return {
    status: "connected",
    apiUrl: status.apiUrl,
    user: result.data,
  };
}

async function handleCreateCampaign(args: Record<string, unknown>) {
  // Validate at least one budget is provided
  if (!args.max_daily_budget_usd && !args.max_weekly_budget_usd && !args.max_monthly_budget_usd) {
    throw new Error("At least one budget is required (max_daily_budget_usd, max_weekly_budget_usd, or max_monthly_budget_usd)");
  }

  const result = await callApi("/v1/campaigns", {
    method: "POST",
    body: {
      name: args.name,
      brandUrl: args.brand_url,
      personTitles: args.target_titles,
      organizationLocations: args.target_locations,
      qOrganizationKeywordTags: args.target_industries,
      recurrence: args.recurrence,
      maxBudgetDailyUsd: args.max_daily_budget_usd,
      maxBudgetWeeklyUsd: args.max_weekly_budget_usd,
      maxBudgetMonthlyUsd: args.max_monthly_budget_usd,
      endDate: args.end_date,
    },
  });

  if (result.error) {
    throw new Error(result.error);
  }

  return result.data;
}

async function handleListCampaigns(args: Record<string, unknown>) {
  const status = args.status || "all";
  const result = await callApi(`/v1/campaigns?status=${status}`);

  if (result.error) {
    throw new Error(result.error);
  }

  return result.data;
}

async function handleCampaignStats(args: Record<string, unknown>) {
  const result = await callApi(`/v1/campaigns/${args.campaign_id}/stats`);

  if (result.error) {
    throw new Error(result.error);
  }

  return result.data;
}

async function handleCampaignDebug(args: Record<string, unknown>) {
  const result = await callApi(`/v1/campaigns/${args.campaign_id}/debug`);

  if (result.error) {
    throw new Error(result.error);
  }

  return result.data;
}

async function handleStopCampaign(args: Record<string, unknown>) {
  const result = await callApi(`/v1/campaigns/${args.campaign_id}/stop`, {
    method: "POST",
  });

  if (result.error) {
    throw new Error(result.error);
  }

  return result.data;
}

async function handleResumeCampaign(args: Record<string, unknown>) {
  const result = await callApi(`/v1/campaigns/${args.campaign_id}/resume`, {
    method: "POST",
  });

  if (result.error) {
    throw new Error(result.error);
  }

  return result.data;
}

async function handleSuggestIcp(args: Record<string, unknown>) {
  const result = await callApi("/v1/brand/icp-suggestion", {
    method: "POST",
    body: {
      brandUrl: args.brand_url,
    },
  });

  if (result.error) {
    throw new Error(result.error);
  }

  return result.data;
}
