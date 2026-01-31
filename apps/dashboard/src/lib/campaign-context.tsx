"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAuth } from "@clerk/nextjs";
import { Campaign, CampaignStats, getCampaignStats } from "./api";

interface CampaignContextType {
  campaign: Campaign | null;
  stats: CampaignStats | null;
  loading: boolean;
  setCampaign: (campaign: Campaign | null) => void;
  refreshStats: () => Promise<void>;
}

const CampaignContext = createContext<CampaignContextType | undefined>(undefined);

interface CampaignProviderProps {
  children: ReactNode;
  campaignId: string;
}

export function CampaignProvider({ children, campaignId }: CampaignProviderProps) {
  const { getToken } = useAuth();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [stats, setStats] = useState<CampaignStats | null>(null);
  const [loading, setLoading] = useState(true);

  async function refreshStats() {
    try {
      const token = await getToken();
      if (!token || !campaignId) return;
      const s = await getCampaignStats(token, campaignId);
      setStats(s);
    } catch (err) {
      console.error("Failed to load campaign stats:", err);
    }
  }

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const token = await getToken();
        if (!token) return;

        // Fetch campaign details
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "https://api.mcpfactory.org"}/v1/campaigns/${campaignId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (response.ok) {
          const data = await response.json();
          setCampaign(data.campaign);
        }

        // Fetch stats
        await refreshStats();
      } catch (err) {
        console.error("Failed to load campaign:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [campaignId]);

  return (
    <CampaignContext.Provider value={{ campaign, stats, loading, setCampaign, refreshStats }}>
      {children}
    </CampaignContext.Provider>
  );
}

export function useCampaign() {
  const context = useContext(CampaignContext);
  if (!context) {
    throw new Error("useCampaign must be used within a CampaignProvider");
  }
  return context;
}
