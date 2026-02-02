"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { GlobeAltIcon } from "@heroicons/react/24/outline";
import { getCampaignStats, type CampaignStats } from "@/lib/api";

interface Brand {
  id: string;
  domain: string;
  name: string | null;
  brandUrl: string;
  createdAt: string;
}

interface Campaign {
  id: string;
  brandId: string | null;
}

function formatCost(cents: string | null | undefined): string | null {
  if (!cents) return null;
  const val = parseFloat(cents);
  if (isNaN(val) || val === 0) return null;
  const usd = val / 100;
  if (usd < 0.01) return "<$0.01";
  return `$${usd.toFixed(2)}`;
}

export default function BrandsPage() {
  const { getToken } = useAuth();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [brandCosts, setBrandCosts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBrands() {
      try {
        const token = await getToken();
        if (!token) return;

        // Fetch brands and all campaigns in parallel
        const [brandsRes, campaignsRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/brands`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/campaigns`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        let loadedBrands: Brand[] = [];
        if (brandsRes.ok) {
          const data = await brandsRes.json();
          loadedBrands = data.brands || [];
          setBrands(loadedBrands);
        }

        // Group campaigns by brandId and fetch stats
        if (campaignsRes.ok && loadedBrands.length > 0) {
          const campaignsData = await campaignsRes.json();
          const campaigns: Campaign[] = campaignsData.campaigns || [];

          // Fetch stats for all campaigns
          const statsMap: Record<string, CampaignStats> = {};
          for (const campaign of campaigns) {
            try {
              statsMap[campaign.id] = await getCampaignStats(token, campaign.id);
            } catch { /* Stats not available */ }
          }

          // Sum costs per brand
          const costs: Record<string, number> = {};
          for (const campaign of campaigns) {
            if (!campaign.brandId) continue;
            const stats = statsMap[campaign.id];
            if (stats?.totalCostInUsdCents) {
              costs[campaign.brandId] = (costs[campaign.brandId] || 0) + (parseFloat(stats.totalCostInUsdCents) || 0);
            }
          }
          setBrandCosts(costs);
        }
      } catch (error) {
        console.error("Failed to fetch brands:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchBrands();
  }, [getToken]);

  if (loading) {
    return (
      <div className="p-4 md:p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-48"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Your Brands</h1>
      </div>

      {brands.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <GlobeAltIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">No brands yet</h3>
          <p className="mt-2 text-sm text-gray-500">
            Brands are created automatically when you start a campaign via MCP.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {brands.map((brand) => (
            <Link
              key={brand.id}
              href={`/brands/${brand.id}`}
              className="block p-6 bg-white rounded-lg border border-gray-200 hover:border-green-300 hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <GlobeAltIcon className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">
                    {brand.name || brand.domain}
                  </h3>
                  <p className="text-sm text-gray-500">{brand.domain}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-400 truncate">{brand.brandUrl}</p>
                {formatCost(brandCosts[brand.id] > 0 ? String(brandCosts[brand.id]) : null) && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 ml-2 flex-shrink-0">
                    {formatCost(String(brandCosts[brand.id]))}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
