import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { getConfigStatus, callApi } from "../lib/api-client.js";

// Tool definitions
export const tools: Tool[] = [
  {
    name: "mcpfactory_status",
    description: "Check MCPFactory connection status and configuration",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "mcpfactory_qualify_reply",
    description: "Qualify an email reply using AI. Classifies the reply as interested, not_interested, out_of_office, etc.",
    inputSchema: {
      type: "object",
      properties: {
        from_email: {
          type: "string",
          description: "Email address of the sender",
        },
        to_email: {
          type: "string",
          description: "Email address of the recipient",
        },
        subject: {
          type: "string",
          description: "Email subject line",
        },
        body: {
          type: "string",
          description: "Email body text",
        },
        campaign_id: {
          type: "string",
          description: "Optional campaign ID for tracking",
        },
      },
      required: ["from_email", "to_email", "body"],
    },
  },
  {
    name: "mcpfactory_scrape_company",
    description: "Scrape company information from a URL. Extracts company name, description, industry, size, etc.",
    inputSchema: {
      type: "object",
      properties: {
        url: {
          type: "string",
          description: "Company website URL to scrape",
        },
      },
      required: ["url"],
    },
  },
  {
    name: "mcpfactory_search_leads",
    description: "Search for leads using Apollo.io. Find people matching specific criteria.",
    inputSchema: {
      type: "object",
      properties: {
        person_titles: {
          type: "array",
          items: { type: "string" },
          description: "Job titles to search for (e.g., ['CEO', 'CTO', 'Founder'])",
        },
        organization_locations: {
          type: "array",
          items: { type: "string" },
          description: "Locations to search in (e.g., ['United States', 'California'])",
        },
        organization_industries: {
          type: "array",
          items: { type: "string" },
          description: "Industries to target (e.g., ['Software', 'SaaS'])",
        },
        organization_num_employees_ranges: {
          type: "array",
          items: { type: "string" },
          description: "Employee count ranges (e.g., ['11,50', '51,200'])",
        },
        per_page: {
          type: "number",
          description: "Number of results per page (default: 10, max: 100)",
        },
      },
      required: ["person_titles"],
    },
  },
  {
    name: "mcpfactory_create_campaign",
    description: "Create a new cold email campaign targeting specific leads",
    inputSchema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Campaign name",
        },
        client_url: {
          type: "string",
          description: "Your company URL (for context in emails)",
        },
        target_titles: {
          type: "array",
          items: { type: "string" },
          description: "Job titles to target",
        },
        target_industries: {
          type: "array",
          items: { type: "string" },
          description: "Industries to target",
        },
        target_locations: {
          type: "array",
          items: { type: "string" },
          description: "Locations to target",
        },
        max_daily_budget_usd: {
          type: "number",
          description: "Maximum daily spend in USD",
        },
        start_date: {
          type: "string",
          description: "Campaign start date (ISO format)",
        },
        end_date: {
          type: "string",
          description: "Optional campaign end date (ISO format)",
        },
      },
      required: ["name", "client_url", "target_titles"],
    },
  },
  {
    name: "mcpfactory_list_campaigns",
    description: "List all your cold email campaigns",
    inputSchema: {
      type: "object",
      properties: {
        status: {
          type: "string",
          enum: ["active", "paused", "completed", "all"],
          description: "Filter by campaign status",
        },
      },
      required: [],
    },
  },
  {
    name: "mcpfactory_campaign_stats",
    description: "Get statistics for a specific campaign",
    inputSchema: {
      type: "object",
      properties: {
        campaign_id: {
          type: "string",
          description: "Campaign ID to get stats for",
        },
      },
      required: ["campaign_id"],
    },
  },
];

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
