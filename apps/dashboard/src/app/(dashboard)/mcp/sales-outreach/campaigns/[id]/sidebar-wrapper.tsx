"use client";

import { useParams } from "next/navigation";
import { CampaignSidebar } from "@/components/campaign-sidebar";
import { useCampaign } from "@/lib/campaign-context";

export function CampaignSidebarWrapper() {
  const params = useParams();
  const { stats } = useCampaign();
  const campaignId = params.id as string;

  return <CampaignSidebar campaignId={campaignId} stats={stats ?? undefined} />;
}
