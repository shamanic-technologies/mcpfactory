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

// Track campaigns currently being processed to avoid duplicate queue entries
// This is a short-term lock, NOT a permanent record (database is source of truth)
const processingCampaigns = new Set<string>();

/**
 * Campaign Scheduler
 * Polls for ongoing campaigns that need to be executed and queues them
 * 
 * Source of truth for "has run" is the database (campaign_runs table).
 * The in-memory Set only prevents duplicate queueing during the same poll cycle.
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
        // Skip if currently being processed (prevents duplicate queue entries)
        if (processingCampaigns.has(campaign.id)) {
          console.log(`[scheduler] Campaign ${campaign.id}: currently processing, skipping`);
          continue;
        }
        
        // Check if we should run this campaign (based on database runs)
        const shouldRun = await shouldRunCampaign(campaign);
        
        console.log(`[scheduler] Campaign ${campaign.id}: shouldRun=${shouldRun}`);
        
        if (shouldRun) {
          console.log(`[scheduler] Queueing campaign ${campaign.id} (${campaign.recurrence}) for org ${campaign.clerkOrgId}`);
          
          // Mark as processing before adding to queue
          processingCampaigns.add(campaign.id);
          
          // Add to queue
          const queues = getQueues();
          await queues[QUEUE_NAMES.CAMPAIGN_RUN].add(
            `campaign-${campaign.id}-${Date.now()}`,
            {
              campaignId: campaign.id,
              clerkOrgId: campaign.clerkOrgId,
            } as CampaignRunJobData
          );
          
          // For oneoff: remove from processing after 5 minutes (allows retry on failure)
          // For recurring: remove immediately so next recurrence can be checked
          if (campaign.recurrence === "oneoff") {
            setTimeout(() => processingCampaigns.delete(campaign.id), 5 * 60 * 1000);
          } else {
            // For recurring campaigns, we rely on the database check each poll
            processingCampaigns.delete(campaign.id);
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
