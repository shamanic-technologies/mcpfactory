"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useParams } from "next/navigation";
import Link from "next/link";
import { PlusIcon } from "@heroicons/react/24/outline";

interface Campaign {
  id: string;
  name: string;
  status: string;
  recurrence: string;
  createdAt: string;
  stats?: {
    leads: number;
    emails: number;
    sent: number;
  };
}

export default function BrandCampaignsPage() {
  const { getToken } = useAuth();
  const params = useParams();
  const brandId = params.brandId as string;
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCampaigns() {
      try {
        const token = await getToken();
        
        // First, get the brand to get its brandUrl
        const brandRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/v1/brands/${brandId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        if (!brandRes.ok) {
          console.error("Failed to fetch brand");
          setLoading(false);
          return;
        }
        
        const brandData = await brandRes.json();
        const brandUrl = brandData.brand?.brandUrl;
        
        if (!brandUrl) {
          console.error("Brand has no URL");
          setLoading(false);
          return;
        }
        
        // Now fetch campaigns filtered by brandUrl
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_CAMPAIGN_SERVICE_URL}/campaigns?brandUrl=${encodeURIComponent(brandUrl)}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.ok) {
          const data = await res.json();
          setCampaigns(data.campaigns || []);
        }
      } catch (error) {
        console.error("Failed to fetch campaigns:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchCampaigns();
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

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Campaigns</h1>
        <Link
          href={`/mcp/sales-outreach?brandId=${brandId}`}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm"
        >
          <PlusIcon className="h-5 w-5" />
          New Campaign
        </Link>
      </div>

      {campaigns.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <svg 
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={1.5} 
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" 
            />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">No campaigns yet</h3>
          <p className="mt-2 text-sm text-gray-500">
            Create your first campaign for this brand.
          </p>
          <Link
            href={`/mcp/sales-outreach?brandId=${brandId}`}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm"
          >
            <PlusIcon className="h-5 w-5" />
            Create Campaign
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {campaigns.map((campaign) => (
            <Link
              key={campaign.id}
              href={`/mcp/sales-outreach/campaigns/${campaign.id}`}
              className="block bg-white rounded-lg border border-gray-200 p-4 hover:border-primary-300 hover:shadow-md transition-all"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">{campaign.name}</h3>
                  <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                    <span className="capitalize">{campaign.recurrence}</span>
                    <span>-</span>
                    <span>Created {new Date(campaign.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <span className={`
                  px-3 py-1 text-sm rounded-full font-medium
                  ${campaign.status === "ongoing" 
                    ? "bg-green-100 text-green-700" 
                    : "bg-gray-100 text-gray-600"
                  }
                `}>
                  {campaign.status}
                </span>
              </div>
              {campaign.stats && (
                <div className="flex gap-6 mt-3 pt-3 border-t border-gray-100 text-sm">
                  <div>
                    <span className="text-gray-500">Leads:</span>{" "}
                    <span className="font-medium text-gray-900">{campaign.stats.leads}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Emails:</span>{" "}
                    <span className="font-medium text-gray-900">{campaign.stats.emails}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Sent:</span>{" "}
                    <span className="font-medium text-gray-900">{campaign.stats.sent}</span>
                  </div>
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
