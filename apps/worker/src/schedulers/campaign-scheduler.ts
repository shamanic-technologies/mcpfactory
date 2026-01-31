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

/**
 * Campaign Scheduler
 * Polls for ongoing campaigns that need to be executed and queues them
 * 
 * Source of truth is the database (campaign_runs table).
 * We check for "running" status runs to avoid duplicate processing.
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
        // Check if we should run this campaign (based on database runs)
        const { shouldRun, hasRunningRun } = await shouldRunCampaign(campaign);
        
        console.log(`[scheduler] Campaign ${campaign.id}: shouldRun=${shouldRun}, hasRunningRun=${hasRunningRun}`);
        
        // Skip if there's already a run in progress
        if (hasRunningRun) {
          console.log(`[scheduler] Campaign ${campaign.id}: has running run, skipping`);
          continue;
        }
        
        if (shouldRun) {
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

interface ShouldRunResult {
  shouldRun: boolean;
  hasRunningRun: boolean;
}

async function shouldRunCampaign(campaign: Campaign): Promise<ShouldRunResult> {
  // Get existing runs for this campaign
  try {
    const runsResult = await campaignService.getCampaignRuns(campaign.id) as { runs: CampaignRun[] };
    const runs = runsResult.runs || [];
    
    // Check if any run is currently in progress
    const hasRunningRun = runs.some(r => r.status === "running" || r.status === "pending");
    
    console.log(`[scheduler] Campaign ${campaign.id} has ${runs.length} runs (${runs.filter(r => r.status === "running").length} running), recurrence=${campaign.recurrence}`);
    
    // Check based on recurrence
    let shouldRun = false;
    switch (campaign.recurrence) {
      case "oneoff":
        // Only run if no completed/failed runs exist yet
        const completedOrFailed = runs.filter(r => r.status === "completed" || r.status === "failed");
        shouldRun = completedOrFailed.length === 0;
        console.log(`[scheduler] oneoff check: completedOrFailed=${completedOrFailed.length}, shouldRun=${shouldRun}`);
        break;
        
      case "daily":
        // Run if no run today
        shouldRun = !hasRunToday(runs);
        break;
        
      case "weekly":
        // Run if no run this week
        shouldRun = !hasRunThisWeek(runs);
        break;
        
      case "monthly":
        // Run if no run this month
        shouldRun = !hasRunThisMonth(runs);
        break;
        
      default:
        shouldRun = false;
    }
    
    return { shouldRun, hasRunningRun };
  } catch (error) {
    console.error(`[scheduler] Error checking runs for ${campaign.id}:`, error);
    return { shouldRun: false, hasRunningRun: false };
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
