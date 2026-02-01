"use client";

import { use } from "react";
import { CampaignProvider } from "@/lib/campaign-context";
import { BrandCampaignSidebarWrapper } from "./sidebar-wrapper";

export default function BrandCampaignLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ brandId: string; id: string }>;
}) {
  const resolvedParams = use(params);

  return (
    <CampaignProvider campaignId={resolvedParams.id}>
      <div className="flex flex-col md:flex-row flex-1 h-full">
        <BrandCampaignSidebarWrapper brandId={resolvedParams.brandId} />
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </CampaignProvider>
  );
}
