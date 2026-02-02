export type McpCategory = "outreach" | "ads";

export interface McpPackage {
  name: string;
  slug: string;
  npmPackage: string;
  description: string;
  category: McpCategory;
  isAvailable: boolean;
  freeQuota: string;
}

export const MCP_PACKAGES: McpPackage[] = [
  {
    name: "Sales Outreach",
    slug: "sales-outreach",
    npmPackage: "@mcpfactory/sales-outreach",
    description: "Cold email campaigns from your URL. Find leads, generate emails, send & optimize.",
    category: "outreach",
    isAvailable: true,
    freeQuota: "1,000 emails",
  },
  {
    name: "Influencer Pitch",
    slug: "influencer-pitch",
    npmPackage: "@mcpfactory/influencer-pitch",
    description: "Find and pitch relevant influencers automatically.",
    category: "outreach",
    isAvailable: false,
    freeQuota: "500 pitches",
  },
  {
    name: "Thought Leader",
    slug: "thought-leader",
    npmPackage: "@mcpfactory/thought-leader",
    description: "Get featured in publications as an industry expert.",
    category: "outreach",
    isAvailable: false,
    freeQuota: "500 pitches",
  },
  {
    name: "Podcaster Pitch",
    slug: "podcaster-pitch",
    npmPackage: "@mcpfactory/podcaster-pitch",
    description: "Get booked as a guest on relevant podcasts.",
    category: "outreach",
    isAvailable: false,
    freeQuota: "500 pitches",
  },
  {
    name: "Journalist Pitch",
    slug: "journalist-pitch",
    npmPackage: "@mcpfactory/journalist-pitch",
    description: "Pitch journalists about your announcements.",
    category: "outreach",
    isAvailable: false,
    freeQuota: "500 pitches",
  },
  {
    name: "Google Ads",
    slug: "google-ads",
    npmPackage: "@mcpfactory/google-ads",
    description: "Create and optimize Google Ads campaigns automatically.",
    category: "ads",
    isAvailable: false,
    freeQuota: "100 campaigns",
  },
  {
    name: "Reddit Ads",
    slug: "reddit-ads",
    npmPackage: "@mcpfactory/reddit-ads",
    description: "Create and optimize Reddit Ads campaigns automatically.",
    category: "ads",
    isAvailable: false,
    freeQuota: "100 campaigns",
  },
];

export const getAvailableMcps = () => MCP_PACKAGES.filter((m) => m.isAvailable);
export const getMcpsByCategory = (cat: McpCategory) => MCP_PACKAGES.filter((m) => m.category === cat);
export const getMcpBySlug = (slug: string) => MCP_PACKAGES.find((m) => m.slug === slug);
