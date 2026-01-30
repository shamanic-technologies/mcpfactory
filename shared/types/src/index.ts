// Common types for MCP Factory

export interface Budget {
  max_daily_usd?: number;
  max_weekly_usd?: number;
  max_monthly_usd?: number;
}

export interface Schedule {
  frequency: "daily" | "weekly" | "once";
  trial_days?: number;
  start_date?: string;
  end_date?: string;
  pause_on_weekend?: boolean;
}

export interface Reporting {
  frequency: "daily" | "weekly" | "on_completion";
  channels?: ("email" | "whatsapp")[];
  email?: string;
  whatsapp?: string;
  include_dashboard_link?: boolean;
}

export interface CampaignStats {
  sent: number;
  delivered: number;
  opened: number;
  replied: number;
  converted: number;
}

export interface CampaignCosts {
  total_byok_usd: number;
  budget_remaining_usd: number;
}

export interface CampaignResult {
  campaign_id: string;
  status: "pending" | "running" | "paused" | "completed" | "failed";
  stats: CampaignStats;
  costs: CampaignCosts;
  dashboard_url: string;
  next_run?: string;
}

export interface UsageStats {
  calls_this_month: number;
  estimated_byok_cost_usd: number;
}

export interface CommunityBenchmarks {
  delivery_rate: string;
  open_rate: string;
  reply_rate: string;
  avg_cost_per_action: string;
}
