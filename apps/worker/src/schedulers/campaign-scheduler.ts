import { getQueues, QUEUE_NAMES, CampaignRunJobData } from "../queues/index.js";
import { campaignService } from "../lib/service-client.js";

interface Campaign {
  id: string;
  orgId: string;
  clerkOrgId: string;
  status: string;
  recurrence: string;
  createdAt: string;
  personTitles?: string[];
  organizationLocations?: string[];
  qOrganizationKeywordTags?: string[];
  requestRaw?: Record<string, unknown>;
}

interface CampaignRun {
  id: string;
  campaignId: string;
  status: string;
  createdAt: string;
}

// Track campaigns we've already queued to avoid duplicates
const queuedCampaigns = new Set<string>();

/**
 * Campaign Scheduler
 * Polls for ongoing campaigns that need to be executed and queues them
 */
export function startCampaignScheduler(intervalMs: number = 30000): NodeJS.Timeout {
  console.log(`[scheduler] Starting campaign scheduler (interval: ${intervalMs}ms)`);

  async function pollCampaigns() {
    try {
      // Get all ongoing campaigns
      const result = await campaignService.listCampaigns() as { campaigns: Campaign[] };
      const campaigns = result.campaigns || [];
      
      const ongoingCampaigns = campaigns.filter(c => c.status === "ongoing");
      console.log(`[scheduler] Found ${ongoingCampaigns.length} ongoing campaigns`);

      for (const campaign of ongoingCampaigns) {
        // Check if we should run this campaign
        const shouldRun = await shouldRunCampaign(campaign);
        const alreadyQueued = queuedCampaigns.has(campaign.id);
        
        console.log(`[scheduler] Campaign ${campaign.id}: shouldRun=${shouldRun}, alreadyQueued=${alreadyQueued}`);
        
        if (shouldRun && !alreadyQueued) {
          console.log(`[scheduler] Queueing campaign ${campaign.id} (${campaign.recurrence}) for org ${campaign.clerkOrgId}`);
          
          // Add to queue
          const queues = getQueues();
          await queues[QUEUE_NAMES.CAMPAIGN_RUN].add(
            `campaign-${campaign.id}-${Date.now()}`,
            {
              campaignId: campaign.id,
              clerkOrgId: campaign.clerkOrgId,
            } as CampaignRunJobData
          );
          
          // Mark as queued (for oneoff, permanently; for recurring, temporarily)
          if (campaign.recurrence === "oneoff") {
            queuedCampaigns.add(campaign.id);
          }
        }
      }
    } catch (error) {
      console.error("[scheduler] Error polling campaigns:", error);
    }
  }

  // Run immediately on start
  pollCampaigns();

  // Then run on interval
  const interval = setInterval(pollCampaigns, intervalMs);
  
  return interval;
}

async function shouldRunCampaign(campaign: Campaign): Promise<boolean> {
  // Get existing runs for this campaign
  try {
    const runsResult = await campaignService.getCampaignRuns(campaign.id) as { runs: CampaignRun[] };
    const runs = runsResult.runs || [];
    
    console.log(`[scheduler] Campaign ${campaign.id} has ${runs.length} runs, recurrence=${campaign.recurrence}`);
    
    // Check based on recurrence
    switch (campaign.recurrence) {
      case "oneoff":
        // Only run if no runs exist yet
        const shouldRun = runs.length === 0;
        console.log(`[scheduler] oneoff check: runs.length=${runs.length}, shouldRun=${shouldRun}`);
        return shouldRun;
        
      case "daily":
        // Run if no run today
        return !hasRunToday(runs);
        
      case "weekly":
        // Run if no run this week
        return !hasRunThisWeek(runs);
        
      case "monthly":
        // Run if no run this month
        return !hasRunThisMonth(runs);
        
      default:
        return false;
    }
  } catch (error) {
    console.error(`[scheduler] Error checking runs for ${campaign.id}:`, error);
    return false;
  }
}

function hasRunToday(runs: CampaignRun[]): boolean {
  const today = new Date().toISOString().split("T")[0];
  return runs.some(r => r.createdAt.split("T")[0] === today);
}

function hasRunThisWeek(runs: CampaignRun[]): boolean {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  return runs.some(r => new Date(r.createdAt) > weekAgo);
}

function hasRunThisMonth(runs: CampaignRun[]): boolean {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  return runs.some(r => new Date(r.createdAt) >= monthStart);
}
