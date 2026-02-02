import { getQueues, QUEUE_NAMES, BrandUpsertJobData } from "../queues/index.js";
import { campaignService, runsService } from "../lib/service-client.js";
import type { Run } from "@mcpfactory/runs-client";

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

// Runs older than this are considered stale and will be marked failed
const STALE_RUN_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Campaign Scheduler
 * Polls for ongoing campaigns that need to be executed and queues them
 *
 * Source of truth is runs-service.
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
        // Check if we should run this campaign (based on runs-service)
        const { shouldRun, hasRunningRun } = await shouldRunCampaign(campaign);

        console.log(`[scheduler] Campaign ${campaign.id}: shouldRun=${shouldRun}, hasRunningRun=${hasRunningRun}`);

        // Skip if there's already a run in progress
        if (hasRunningRun) {
          console.log(`[scheduler] Campaign ${campaign.id}: has running run, skipping`);
          continue;
        }

        if (shouldRun) {
          console.log(`[scheduler] Queueing campaign ${campaign.id} (${campaign.recurrence}) for org ${campaign.clerkOrgId}`);

          // Add to brand-upsert queue (first step in campaign run chain)
          const queues = getQueues();
          await queues[QUEUE_NAMES.BRAND_UPSERT].add(
            `campaign-${campaign.id}-${Date.now()}`,
            {
              campaignId: campaign.id,
              clerkOrgId: campaign.clerkOrgId,
            } as BrandUpsertJobData
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

async function getRunsForCampaign(campaign: Campaign): Promise<Run[]> {
  const runsOrgId = await runsService.ensureOrganization(campaign.clerkOrgId);
  const result = await runsService.listRuns({
    organizationId: runsOrgId,
    serviceName: "campaign-service",
    taskName: campaign.id,
    limit: 200,
  });
  return result.runs;
}

async function shouldRunCampaign(campaign: Campaign): Promise<ShouldRunResult> {
  try {
    let runs = await getRunsForCampaign(campaign);

    // Cleanup stale runs (running for too long = probably crashed)
    const now = Date.now();
    for (const run of runs) {
      if (run.status === "running" &&
          now - new Date(run.createdAt).getTime() > STALE_RUN_TIMEOUT_MS) {
        console.log(`[scheduler] Run ${run.id} is stale (>${STALE_RUN_TIMEOUT_MS / 60000} min), marking as failed`);
        try {
          await runsService.updateRun(run.id, "failed");
        } catch (err) {
          console.error(`[scheduler] Failed to mark stale run ${run.id} as failed:`, err);
        }
      }
    }

    // Re-fetch runs after cleanup
    runs = await getRunsForCampaign(campaign);

    // Check if any run is currently in progress
    const hasRunningRun = runs.some(r => r.status === "running");

    console.log(`[scheduler] Campaign ${campaign.id} has ${runs.length} runs (${runs.filter(r => r.status === "running").length} running), recurrence=${campaign.recurrence}`);

    // Check based on recurrence
    let shouldRun = false;
    switch (campaign.recurrence) {
      case "oneoff": {
        // Only run if no completed/failed runs exist yet
        const completedOrFailed = runs.filter(r => r.status === "completed" || r.status === "failed");
        shouldRun = completedOrFailed.length === 0;
        console.log(`[scheduler] oneoff check: completedOrFailed=${completedOrFailed.length}, shouldRun=${shouldRun}`);
        break;
      }

      case "daily":
        shouldRun = !hasRunToday(runs);
        break;

      case "weekly":
        shouldRun = !hasRunThisWeek(runs);
        break;

      case "monthly":
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

function hasRunToday(runs: Run[]): boolean {
  const today = new Date().toISOString().split("T")[0];
  return runs.some(r => r.createdAt.split("T")[0] === today);
}

function hasRunThisWeek(runs: Run[]): boolean {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  return runs.some(r => new Date(r.createdAt) > weekAgo);
}

function hasRunThisMonth(runs: Run[]): boolean {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  return runs.some(r => new Date(r.createdAt) >= monthStart);
}
