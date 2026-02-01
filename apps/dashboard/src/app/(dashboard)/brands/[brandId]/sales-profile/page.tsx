"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useParams } from "next/navigation";

interface SalesProfile {
  companyName: string | null;
  valueProposition: string | null;
  companyOverview: string | null;
  targetAudience: string | null;
  customerPainPoints: string[];
  keyFeatures: string[];
  productDifferentiators: string[];
  competitors: string[];
  socialProof: {
    caseStudies: string[];
    testimonials: string[];
    results: string[];
  };
  callToAction: string | null;
  additionalContext: string | null;
  extractedAt: string;
}

export default function BrandSalesProfilePage() {
  const { getToken } = useAuth();
  const params = useParams();
  const brandId = params.brandId as string;
  const [profile, setProfile] = useState<SalesProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const token = await getToken();
        // Use API gateway which has the X-API-Key for brand-service
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/v1/brands/${brandId}/sales-profile`,
          {
            headers: { 
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        
        if (res.status === 404) {
          setProfile(null);
          return;
        }
        
        if (!res.ok) {
          throw new Error("Failed to fetch sales profile");
        }
        
        const data = await res.json();
        setProfile(data.profile);
      } catch (err: any) {
        console.error("Failed to fetch profile:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, [brandId, getToken]);

  if (loading) {
    return (
      <div className="p-4 md:p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-48"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 md:p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">Error: {error}</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-4 md:p-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-6">Sales Profile</h1>
        <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-8 text-center">
          <p className="text-gray-500 mb-4">No sales profile extracted yet.</p>
          <p className="text-sm text-gray-400">
            The sales profile will be automatically extracted when you run a campaign.
          </p>
        </div>
      </div>
    );
  }

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="bg-white rounded-lg border border-gray-200 p-4 md:p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-3">{title}</h2>
      {children}
    </div>
  );

  const List = ({ items }: { items: string[] }) => (
    <ul className="space-y-1">
      {items.map((item, i) => (
        <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
          <span className="text-primary-500 mt-1">-</span>
          {item}
        </li>
      ))}
    </ul>
  );

  return (
    <div className="p-4 md:p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Sales Profile</h1>
        {profile.extractedAt && (
          <span className="text-xs text-gray-400">
            Last updated: {new Date(profile.extractedAt).toLocaleDateString()}
          </span>
        )}
      </div>

      <div className="space-y-4">
        {profile.companyName && (
          <Section title="Company Name">
            <p className="text-gray-700">{profile.companyName}</p>
          </Section>
        )}

        {profile.valueProposition && (
          <Section title="Value Proposition">
            <p className="text-gray-700">{profile.valueProposition}</p>
          </Section>
        )}

        {profile.companyOverview && (
          <Section title="Company Overview">
            <p className="text-gray-700">{profile.companyOverview}</p>
          </Section>
        )}

        {profile.targetAudience && (
          <Section title="Target Audience">
            <p className="text-gray-700">{profile.targetAudience}</p>
          </Section>
        )}

        {profile.customerPainPoints?.length > 0 && (
          <Section title="Customer Pain Points">
            <List items={profile.customerPainPoints} />
          </Section>
        )}

        {profile.keyFeatures?.length > 0 && (
          <Section title="Key Features">
            <List items={profile.keyFeatures} />
          </Section>
        )}

        {profile.productDifferentiators?.length > 0 && (
          <Section title="Product Differentiators">
            <List items={profile.productDifferentiators} />
          </Section>
        )}

        {profile.competitors?.length > 0 && (
          <Section title="Competitors">
            <List items={profile.competitors} />
          </Section>
        )}

        {(profile.socialProof?.caseStudies?.length > 0 || 
          profile.socialProof?.testimonials?.length > 0 || 
          profile.socialProof?.results?.length > 0) && (
          <Section title="Social Proof">
            {profile.socialProof.caseStudies?.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Case Studies</h3>
                <List items={profile.socialProof.caseStudies} />
              </div>
            )}
            {profile.socialProof.testimonials?.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Testimonials</h3>
                <List items={profile.socialProof.testimonials} />
              </div>
            )}
            {profile.socialProof.results?.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Results</h3>
                <List items={profile.socialProof.results} />
              </div>
            )}
          </Section>
        )}

        {profile.callToAction && (
          <Section title="Call to Action">
            <p className="text-gray-700">{profile.callToAction}</p>
          </Section>
        )}

        {profile.additionalContext && (
          <Section title="Additional Context">
            <p className="text-gray-700">{profile.additionalContext}</p>
          </Section>
        )}
      </div>
    </div>
  );
}
