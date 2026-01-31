"use client";

import { use } from "react";
import { CampaignProvider } from "@/lib/campaign-context";
import { CampaignSidebarWrapper } from "./sidebar-wrapper";

export default function CampaignLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);

  return (
    <CampaignProvider campaignId={resolvedParams.id}>
      <div className="flex flex-1 h-full">
        <CampaignSidebarWrapper />
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </CampaignProvider>
  );
}
