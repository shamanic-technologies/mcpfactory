"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";

interface SalesProfile {
  id: string;
  companyName: string;
  valueProposition: string;
  companyOverview: string;
  targetAudience: string;
  callToAction: string;
  customerPainPoints: string[];
  competitors: string[];
  productDifferentiators: string[];
  keyFeatures: string[];
  extractedAt: string;
  url: string;
}

export default function CompanyInfoPage() {
  const { getToken } = useAuth();
  const [profiles, setProfiles] = useState<SalesProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProfiles() {
      try {
        const token = await getToken();
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/v1/company/sales-profiles`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch profiles");
        }

        const data = await response.json();
        setProfiles(data.profiles || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchProfiles();
  }, [getToken]);

  if (loading) {
    return (
      <div className="p-4 md:p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 md:p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          Error: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Company Information</h1>
        <p className="text-gray-500 mt-1">
          Sales profiles extracted from company websites
        </p>
      </div>

      {profiles.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <svg
            className="w-12 h-12 text-gray-400 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-1">
            No company profiles yet
          </h3>
          <p className="text-gray-500">
            Company profiles will appear here when you create campaigns with client URLs
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {profiles.map((profile) => (
            <div
              key={profile.id}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {profile.companyName || "Unknown Company"}
                  </h3>
                  {profile.url && (
                    <a
                      href={profile.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary-600 hover:underline"
                    >
                      {profile.url}
                    </a>
                  )}
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(profile.extractedAt).toLocaleDateString()}
                </span>
              </div>

              {profile.valueProposition && (
                <div className="mb-3">
                  <h4 className="text-xs font-medium text-gray-500 uppercase mb-1">
                    Value Proposition
                  </h4>
                  <p className="text-sm text-gray-700">{profile.valueProposition}</p>
                </div>
              )}

              {profile.companyOverview && (
                <div className="mb-3">
                  <h4 className="text-xs font-medium text-gray-500 uppercase mb-1">
                    Overview
                  </h4>
                  <p className="text-sm text-gray-700">
                    {profile.companyOverview}
                  </p>
                </div>
              )}

              {profile.targetAudience && (
                <div className="mb-3">
                  <h4 className="text-xs font-medium text-gray-500 uppercase mb-1">
                    Target Audience
                  </h4>
                  <p className="text-sm text-gray-700">{profile.targetAudience}</p>
                </div>
              )}

              {profile.callToAction && (
                <div className="mb-3">
                  <h4 className="text-xs font-medium text-gray-500 uppercase mb-1">
                    Call to Action
                  </h4>
                  <p className="text-sm text-gray-700">{profile.callToAction}</p>
                </div>
              )}

              {profile.customerPainPoints && profile.customerPainPoints.length > 0 && (
                <div className="mb-3">
                  <h4 className="text-xs font-medium text-gray-500 uppercase mb-1">
                    Customer Pain Points
                  </h4>
                  <ul className="text-sm text-gray-700 list-disc list-inside">
                    {profile.customerPainPoints.map((point, i) => (
                      <li key={i}>{point}</li>
                    ))}
                  </ul>
                </div>
              )}

              {profile.productDifferentiators && profile.productDifferentiators.length > 0 && (
                <div className="mb-3">
                  <h4 className="text-xs font-medium text-gray-500 uppercase mb-1">
                    Product Differentiators
                  </h4>
                  <ul className="text-sm text-gray-700 list-disc list-inside">
                    {profile.productDifferentiators.map((diff, i) => (
                      <li key={i}>{diff}</li>
                    ))}
                  </ul>
                </div>
              )}

              {profile.keyFeatures && profile.keyFeatures.length > 0 && (
                <div className="mb-3">
                  <h4 className="text-xs font-medium text-gray-500 uppercase mb-1">
                    Key Features
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {profile.keyFeatures.map((feature, i) => (
                      <span key={i} className="text-xs bg-primary-50 text-primary-700 px-2 py-0.5 rounded">
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {profile.competitors && profile.competitors.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-gray-500 uppercase mb-1">
                    Competitors
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {profile.competitors.map((comp, i) => (
                      <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                        {comp}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
