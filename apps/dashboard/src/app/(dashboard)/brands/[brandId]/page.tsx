"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useParams } from "next/navigation";
import Link from "next/link";

interface Brand {
  id: string;
  domain: string;
  name: string | null;
  brandUrl: string;
  createdAt: string;
}

interface Campaign {
  id: string;
  name: string;
  status: string;
  createdAt: string;
}

export default function BrandOverviewPage() {
  const { getToken } = useAuth();
  const params = useParams();
  const brandId = params.brandId as string;
  const [brand, setBrand] = useState<Brand | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const token = await getToken();
        
        // Fetch brand
        const brandRes = await fetch(
          `${process.env.NEXT_PUBLIC_CAMPAIGN_SERVICE_URL}/brands/${brandId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (brandRes.ok) {
          const data = await brandRes.json();
          setBrand(data.brand);
        }

        // Fetch campaigns for this brand
        const campaignsRes = await fetch(
          `${process.env.NEXT_PUBLIC_CAMPAIGN_SERVICE_URL}/campaigns?brandId=${brandId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (campaignsRes.ok) {
          const data = await campaignsRes.json();
          setCampaigns(data.campaigns || []);
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [brandId, getToken]);

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

  if (!brand) {
    return (
      <div className="p-4 md:p-8">
        <p className="text-gray-500">Brand not found</p>
      </div>
    );
  }

  const ongoingCampaigns = campaigns.filter(c => c.status === "ongoing");
  const stoppedCampaigns = campaigns.filter(c => c.status === "stopped");

  return (
    <div className="p-4 md:p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">
          {brand.name || brand.domain}
        </h1>
        <a 
          href={brand.brandUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-sm text-primary-600 hover:underline"
        >
          {brand.brandUrl}
        </a>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-2xl font-semibold text-gray-900">{campaigns.length}</p>
          <p className="text-sm text-gray-500">Total Campaigns</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-2xl font-semibold text-green-600">{ongoingCampaigns.length}</p>
          <p className="text-sm text-gray-500">Active</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-2xl font-semibold text-gray-400">{stoppedCampaigns.length}</p>
          <p className="text-sm text-gray-500">Stopped</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href={`/brands/${brandId}/campaigns`}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition text-sm"
          >
            View Campaigns
          </Link>
          <Link
            href={`/brands/${brandId}/sales-profile`}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm"
          >
            View Sales Profile
          </Link>
        </div>
      </div>

      {/* Recent Campaigns */}
      {campaigns.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Campaigns</h2>
          <div className="space-y-3">
            {campaigns.slice(0, 5).map(campaign => (
              <div key={campaign.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-900">{campaign.name}</p>
                  <p className="text-xs text-gray-500">
                    Created {new Date(campaign.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <span className={`
                  px-2 py-1 text-xs rounded-full
                  ${campaign.status === "ongoing" 
                    ? "bg-green-100 text-green-700" 
                    : "bg-gray-100 text-gray-600"
                  }
                `}>
                  {campaign.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
