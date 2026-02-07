import { Router } from "express";
import { callExternalService, externalServices } from "../lib/service-client.js";

const router = Router();

interface Campaign {
  id: string;
  brandId: string | null;
  brandUrl: string | null;
}

interface Run {
  id: string;
}

interface DeliveryStats {
  emailsSent: number;
  emailsOpened: number;
  emailsClicked: number;
  emailsReplied: number;
  emailsBounced: number;
}

const EMPTY_STATS: DeliveryStats = {
  emailsSent: 0,
  emailsOpened: 0,
  emailsClicked: 0,
  emailsReplied: 0,
  emailsBounced: 0,
};

interface BrandEntry {
  brandId: string | null;
  brandUrl: string | null;
  brandDomain: string | null;
  emailsSent: number;
  emailsOpened: number;
  emailsClicked: number;
  emailsReplied: number;
  totalCostUsdCents: number;
  openRate: number;
  clickRate: number;
  replyRate: number;
  costPerOpenCents: number | null;
  costPerClickCents: number | null;
  costPerReplyCents: number | null;
}

interface ModelEntry {
  model: string;
  emailsGenerated: number;
  emailsSent: number;
  emailsOpened: number;
  emailsClicked: number;
  emailsReplied: number;
  totalCostUsdCents: number;
  openRate: number;
  clickRate: number;
  replyRate: number;
  costPerOpenCents: number | null;
  costPerClickCents: number | null;
  costPerReplyCents: number | null;
}

interface LeaderboardData {
  brands: BrandEntry[];
  models: ModelEntry[];
  hero: unknown;
  updatedAt: string;
}

function sumStats(a: DeliveryStats, b: DeliveryStats): DeliveryStats {
  return {
    emailsSent: a.emailsSent + b.emailsSent,
    emailsOpened: a.emailsOpened + b.emailsOpened,
    emailsClicked: a.emailsClicked + b.emailsClicked,
    emailsReplied: a.emailsReplied + b.emailsReplied,
    emailsBounced: a.emailsBounced + b.emailsBounced,
  };
}

/** Call a delivery service's /stats endpoint; return EMPTY_STATS on failure. */
async function fetchDeliveryStats(
  service: { url: string; apiKey: string },
  runIds: string[]
): Promise<DeliveryStats> {
  try {
    const result = await callExternalService<{ stats: DeliveryStats }>(
      service,
      "/stats",
      { method: "POST", body: { runIds } }
    );
    return result.stats || EMPTY_STATS;
  } catch {
    return EMPTY_STATS;
  }
}

/** Fetch stats from both Postmark and Instantly, return combined totals. */
async function fetchCombinedDeliveryStats(runIds: string[]): Promise<DeliveryStats> {
  const [postmarkStats, instantlyStats] = await Promise.all([
    fetchDeliveryStats(externalServices.postmark, runIds),
    fetchDeliveryStats(externalServices.instantly, runIds),
  ]);
  return sumStats(postmarkStats, instantlyStats);
}

function applyStatsToEntry(
  entry: { emailsSent: number; emailsOpened: number; emailsClicked: number; emailsReplied: number; totalCostUsdCents: number; openRate: number; clickRate: number; replyRate: number; costPerOpenCents: number | null; costPerClickCents: number | null; costPerReplyCents: number | null },
  stats: DeliveryStats
) {
  entry.emailsSent = stats.emailsSent;
  entry.emailsOpened = stats.emailsOpened;
  entry.emailsClicked = stats.emailsClicked;
  entry.emailsReplied = stats.emailsReplied;

  const sent = stats.emailsSent;
  entry.openRate = sent > 0 ? Math.round((stats.emailsOpened / sent) * 10000) / 10000 : 0;
  entry.clickRate = sent > 0 ? Math.round((stats.emailsClicked / sent) * 10000) / 10000 : 0;
  entry.replyRate = sent > 0 ? Math.round((stats.emailsReplied / sent) * 10000) / 10000 : 0;

  const cost = entry.totalCostUsdCents;
  entry.costPerOpenCents = stats.emailsOpened > 0 ? Math.round(cost / stats.emailsOpened) : null;
  entry.costPerClickCents = stats.emailsClicked > 0 ? Math.round(cost / stats.emailsClicked) : null;
  entry.costPerReplyCents = stats.emailsReplied > 0 ? Math.round(cost / stats.emailsReplied) : null;
}

/**
 * Enrich leaderboard email stats from both postmark-service and instantly-service.
 * The campaign-service only queries postmark internally, but emails may also go
 * through Instantly. This fetches from both and sums the results.
 */
async function enrichWithDeliveryStats(data: LeaderboardData): Promise<void> {
  // Get all campaigns (API-key auth, no org needed)
  const allCampaignsResult = await callExternalService<{ campaigns: Campaign[] }>(
    externalServices.campaign,
    "/internal/campaigns/all"
  );

  const campaigns = allCampaignsResult.campaigns || [];
  console.log(`[perf] Found ${campaigns.length} campaigns from /internal/campaigns/all`);
  if (campaigns.length === 0) return;

  // Get runs for all campaigns in parallel
  const runsResults = await Promise.all(
    campaigns.map(async (campaign) => {
      try {
        const result = await callExternalService<{ runs: Run[] }>(
          externalServices.campaign,
          `/internal/campaigns/${campaign.id}/runs/all`
        );
        return { campaign, runIds: (result.runs || []).map((r) => r.id) };
      } catch (err) {
        console.warn(`[perf] Failed to get runs for campaign ${campaign.id}:`, (err as Error).message);
        return { campaign, runIds: [] as string[] };
      }
    })
  );

  // Group runIds by brand key (brandId or brandUrl)
  const runIdsByBrand = new Map<string, string[]>();
  const allRunIds: string[] = [];

  for (const { campaign, runIds } of runsResults) {
    if (runIds.length === 0) continue;
    allRunIds.push(...runIds);

    const brandKey = campaign.brandId || campaign.brandUrl;
    if (brandKey) {
      const existing = runIdsByBrand.get(brandKey) || [];
      existing.push(...runIds);
      runIdsByBrand.set(brandKey, existing);
    }
  }

  console.log(`[perf] Total runIds: ${allRunIds.length}, brands with runs: ${runIdsByBrand.size}`);
  if (allRunIds.length === 0) return;

  // Fetch combined delivery stats (postmark + instantly) per brand, in parallel
  await Promise.all(
    data.brands.map(async (brand) => {
      const brandRunIds =
        (brand.brandId && runIdsByBrand.get(brand.brandId)) ||
        (brand.brandUrl && runIdsByBrand.get(brand.brandUrl)) ||
        null;
      if (!brandRunIds || brandRunIds.length === 0) {
        console.log(`[perf] No runIds for brand ${brand.brandDomain} (brandId=${brand.brandId}, brandUrl=${brand.brandUrl})`);
        return;
      }

      console.log(`[perf] Fetching delivery stats for brand ${brand.brandDomain} with ${brandRunIds.length} runIds`);
      const stats = await fetchCombinedDeliveryStats(brandRunIds);
      console.log(`[perf] Brand ${brand.brandDomain} delivery: sent=${stats.emailsSent}, opened=${stats.emailsOpened}`);
      if (stats.emailsSent === 0) return;
      applyStatsToEntry(brand, stats);
    })
  );

  // Fetch aggregate stats for model leaderboard
  const aggregateStats = await fetchCombinedDeliveryStats(allRunIds);
  console.log(`[perf] Aggregate delivery: sent=${aggregateStats.emailsSent}, opened=${aggregateStats.emailsOpened}`);

  if (aggregateStats.emailsSent > 0 && data.models.length > 0) {
    // Distribute delivery stats across models proportionally by emailsGenerated
    const totalGenerated = data.models.reduce((s, m) => s + m.emailsGenerated, 0);

    for (const model of data.models) {
      const ratio = totalGenerated > 0 ? model.emailsGenerated / totalGenerated : 1 / data.models.length;
      const modelStats: DeliveryStats = {
        emailsSent: Math.round(aggregateStats.emailsSent * ratio),
        emailsOpened: Math.round(aggregateStats.emailsOpened * ratio),
        emailsClicked: Math.round(aggregateStats.emailsClicked * ratio),
        emailsReplied: Math.round(aggregateStats.emailsReplied * ratio),
        emailsBounced: Math.round(aggregateStats.emailsBounced * ratio),
      };
      applyStatsToEntry(model, modelStats);
    }

    // Recompute hero stats
    const withConversion = data.models.map((m) => ({
      model: m.model,
      conversionRate: m.emailsSent > 0 ? (m.emailsClicked + m.emailsReplied) / m.emailsSent : 0,
      conversionsPerDollar:
        m.totalCostUsdCents > 0
          ? ((m.emailsClicked + m.emailsReplied) / m.totalCostUsdCents) * 100
          : 0,
    }));

    const bestConversion = withConversion.reduce((a, b) => (a.conversionRate > b.conversionRate ? a : b));
    const bestValue = withConversion.reduce((a, b) => (a.conversionsPerDollar > b.conversionsPerDollar ? a : b));

    data.hero = {
      bestConversionModel: {
        model: bestConversion.model,
        conversionRate: Math.round(bestConversion.conversionRate * 10000) / 10000,
      },
      bestValueModel: {
        model: bestValue.model,
        conversionsPerDollar: Math.round(bestValue.conversionsPerDollar * 100) / 100,
      },
    };
  }
}

// Public route — no auth required
router.get("/performance/leaderboard", async (req, res) => {
  // #swagger.tags = ['Performance']
  // #swagger.summary = 'Get performance leaderboard'
  // #swagger.description = 'Returns public performance leaderboard data. No authentication required.'
  try {
    const data = await callExternalService<LeaderboardData>(
      externalServices.campaign,
      "/internal/performance/leaderboard"
    );

    // Enrich with combined delivery stats from postmark + instantly
    try {
      await enrichWithDeliveryStats(data);
    } catch (err) {
      console.warn("Failed to enrich leaderboard with delivery stats:", err);
    }

    res.json(data);
  } catch (error) {
    console.error("Performance leaderboard proxy error:", error);
    res.status(502).json({ error: "Failed to fetch leaderboard data" });
  }
});

export default router;
