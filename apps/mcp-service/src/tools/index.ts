import { z } from "zod";
import { getConfigStatus, callApi } from "../lib/api-client.js";

// Tool definitions with Zod schemas
export const toolDefinitions = {
  mcpfactory_status: {
    description: "Check MCPFactory connection status and configuration",
    schema: z.object({}),
  },
  mcpfactory_qualify_reply: {
    description: "Qualify an email reply using AI. Classifies the reply as interested, not_interested, out_of_office, etc.",
    schema: z.object({
      from_email: z.string().describe("Email address of the sender"),
      to_email: z.string().describe("Email address of the recipient"),
      subject: z.string().optional().describe("Email subject line"),
      body: z.string().describe("Email body text"),
      campaign_id: z.string().optional().describe("Optional campaign ID for tracking"),
    }),
  },
  mcpfactory_scrape_company: {
    description: "Scrape company information from a URL. Extracts company name, description, industry, size, etc.",
    schema: z.object({
      url: z.string().describe("Company website URL to scrape"),
    }),
  },
  mcpfactory_search_leads: {
    description: "Search for leads using Apollo.io. Find people matching specific criteria.",
    schema: z.object({
      person_titles: z.array(z.string()).describe("Job titles to search for (e.g., ['CEO', 'CTO', 'Founder'])"),
      organization_locations: z.array(z.string()).optional().describe("Locations to search in"),
      organization_industries: z.array(z.string()).optional().describe("Industries to target"),
      organization_num_employees_ranges: z.array(z.string()).optional().describe("Employee count ranges"),
      per_page: z.number().optional().describe("Number of results per page (default: 10, max: 100)"),
    }),
  },
  mcpfactory_create_campaign: {
    description: "Create a new cold email campaign targeting specific leads",
    schema: z.object({
      name: z.string().describe("Campaign name"),
      client_url: z.string().describe("Your company URL (for context in emails)"),
      target_titles: z.array(z.string()).describe("Job titles to target"),
      target_industries: z.array(z.string()).optional().describe("Industries to target"),
      target_locations: z.array(z.string()).optional().describe("Locations to target"),
      max_daily_budget_usd: z.number().optional().describe("Maximum daily spend in USD"),
      start_date: z.string().optional().describe("Campaign start date (ISO format)"),
      end_date: z.string().optional().describe("Optional campaign end date (ISO format)"),
    }),
  },
  mcpfactory_list_campaigns: {
    description: "List all your cold email campaigns",
    schema: z.object({
      status: z.enum(["active", "paused", "completed", "all"]).optional().describe("Filter by campaign status"),
    }),
  },
  mcpfactory_campaign_stats: {
    description: "Get statistics for a specific campaign",
    schema: z.object({
      campaign_id: z.string().describe("Campaign ID to get stats for"),
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

    case "mcpfactory_qualify_reply":
      return handleQualifyReply(args);

    case "mcpfactory_scrape_company":
      return handleScrapeCompany(args);

    case "mcpfactory_search_leads":
      return handleSearchLeads(args);

    case "mcpfactory_create_campaign":
      return handleCreateCampaign(args);

    case "mcpfactory_list_campaigns":
      return handleListCampaigns(args);

    case "mcpfactory_campaign_stats":
      return handleCampaignStats(args);

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

async function handleQualifyReply(args: Record<string, unknown>) {
  const result = await callApi("/v1/qualify", {
    method: "POST",
    body: {
      sourceService: "mcp",
      sourceOrgId: "mcp-user",
      sourceRefId: args.campaign_id,
      fromEmail: args.from_email,
      toEmail: args.to_email,
      subject: args.subject,
      bodyText: args.body,
    },
  });

  if (result.error) {
    throw new Error(result.error);
  }

  return result.data;
}

async function handleScrapeCompany(args: Record<string, unknown>) {
  const result = await callApi("/v1/company/scrape", {
    method: "POST",
    body: {
      url: args.url,
    },
  });

  if (result.error) {
    throw new Error(result.error);
  }

  return result.data;
}

async function handleSearchLeads(args: Record<string, unknown>) {
  const result = await callApi("/v1/leads/search", {
    method: "POST",
    body: {
      person_titles: args.person_titles,
      organization_locations: args.organization_locations,
      organization_industries: args.organization_industries,
      organization_num_employees_ranges: args.organization_num_employees_ranges,
      per_page: args.per_page || 10,
    },
  });

  if (result.error) {
    throw new Error(result.error);
  }

  return result.data;
}

async function handleCreateCampaign(args: Record<string, unknown>) {
  const result = await callApi("/v1/campaigns", {
    method: "POST",
    body: {
      name: args.name,
      clientUrl: args.client_url,
      targetTitles: args.target_titles,
      targetIndustries: args.target_industries,
      targetLocations: args.target_locations,
      maxDailyBudgetUsd: args.max_daily_budget_usd,
      startDate: args.start_date,
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
