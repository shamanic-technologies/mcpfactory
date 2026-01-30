// BYOK (Bring Your Own Key) management for MCP Factory
// TODO: Implement when backend is ready

export interface ByokKeys {
  openai?: string;
  anthropic?: string;
  apollo?: string;
  clearbit?: string;
  resend?: string;
  googleAds?: string;
  redditAds?: string;
}

export interface ByokCostEstimate {
  provider: string;
  action: string;
  estimated_cost_usd: number;
}

export async function getByokKeys(userId: string): Promise<ByokKeys> {
  // TODO: Fetch from backend
  return {};
}

export function estimateCost(action: string): ByokCostEstimate[] {
  // Estimated costs per action
  const estimates: Record<string, ByokCostEstimate[]> = {
    email_outreach: [
      { provider: "openai", action: "email_generation", estimated_cost_usd: 0.01 },
      { provider: "apollo", action: "lead_lookup", estimated_cost_usd: 0.005 },
      { provider: "resend", action: "email_send", estimated_cost_usd: 0.001 },
    ],
    influencer_pitch: [
      { provider: "openai", action: "pitch_generation", estimated_cost_usd: 0.02 },
      { provider: "resend", action: "email_send", estimated_cost_usd: 0.001 },
    ],
  };

  return estimates[action] || [];
}
