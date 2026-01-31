"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { 
  listByokKeys, setByokKey, deleteByokKey, ByokKey,
  listCampaigns, getCampaignStats, Campaign, CampaignStats
} from "@/lib/api";
import { SkeletonKeysList } from "@/components/skeleton";

type Tab = "keys" | "campaigns" | "spending";

const REQUIRED_KEYS = [
  { 
    id: "apollo", 
    name: "Apollo", 
    description: "For lead search and enrichment", 
    placeholder: "api_...",
    helpUrl: "https://app.apollo.io/#/settings/integrations/api",
    helpText: "Get your API key"
  },
  { 
    id: "anthropic", 
    name: "Anthropic", 
    description: "For email generation and reply qualification (Claude)", 
    placeholder: "sk-ant-...",
    helpUrl: "https://console.anthropic.com/settings/keys",
    helpText: "Get your API key"
  },
];

export default function SalesOutreachPage() {
  const { getToken } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("keys");
  const [keys, setKeys] = useState<ByokKey[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [campaignStats, setCampaignStats] = useState<Record<string, CampaignStats>>({});
  const [loading, setLoading] = useState(true);
  const [campaignsLoading, setCampaignsLoading] = useState(true);
  const [editingProvider, setEditingProvider] = useState<string | null>(null);
  const [newKeyValue, setNewKeyValue] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadKeys();
    loadCampaigns();
    
    // Poll campaigns every 5 seconds
    const interval = setInterval(() => {
      loadCampaigns();
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  async function loadKeys() {
    try {
      const token = await getToken();
      if (!token) return;
      const data = await listByokKeys(token);
      setKeys(data.keys);
    } catch (err) {
      console.error("Failed to load keys:", err);
    } finally {
      setLoading(false);
    }
  }

  async function loadCampaigns() {
    try {
      const token = await getToken();
      if (!token) return;
      const data = await listCampaigns(token);
      setCampaigns(data.campaigns || []);
      
      // Load stats for each campaign
      const stats: Record<string, CampaignStats> = {};
      for (const campaign of data.campaigns || []) {
        try {
          const s = await getCampaignStats(token, campaign.id);
          stats[campaign.id] = s;
        } catch {
          // Stats not available yet
        }
      }
      setCampaignStats(stats);
    } catch (err) {
      console.error("Failed to load campaigns:", err);
    } finally {
      setCampaignsLoading(false);
    }
  }

  async function handleSaveKey(provider: string) {
    if (!newKeyValue.trim()) return;
    setSaving(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      await setByokKey(token, provider, newKeyValue);
      await loadKeys();
      setEditingProvider(null);
      setNewKeyValue("");
    } catch (err) {
      console.error("Failed to save key:", err);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteKey(provider: string) {
    if (!confirm(`Delete ${provider} key?`)) return;
    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      await deleteByokKey(token, provider);
      await loadKeys();
    } catch (err) {
      console.error("Failed to delete key:", err);
    }
  }

  function getKeyForProvider(provider: string): ByokKey | undefined {
    return keys.find((k) => k.provider === provider);
  }

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  function getStatusColor(status: string): string {
    switch (status) {
      case "ongoing": return "bg-green-100 text-green-700 border-green-200";
      case "stopped": return "bg-gray-100 text-gray-500 border-gray-200";
      default: return "bg-gray-100 text-gray-700 border-gray-200";
    }
  }

  const configuredCount = REQUIRED_KEYS.filter((k) => getKeyForProvider(k.id)).length;
  const isFullyConfigured = configuredCount === REQUIRED_KEYS.length;

  // Calculate totals from all campaign stats
  const totalStats = Object.values(campaignStats).reduce(
    (acc, s) => ({
      emailsSent: acc.emailsSent + (s.emailsSent || 0),
      emailsOpened: acc.emailsOpened + (s.emailsOpened || 0),
      emailsReplied: acc.emailsReplied + (s.emailsReplied || 0),
    }),
    { emailsSent: 0, emailsOpened: 0, emailsReplied: 0 }
  );

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">📧</span>
          <h1 className="font-display text-2xl font-bold text-gray-800">Sales Cold Emails</h1>
          {isFullyConfigured ? (
            <span className="text-xs bg-accent-100 text-accent-700 px-2 py-1 rounded-full border border-accent-200">
              Ready
            </span>
          ) : (
            <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full border border-yellow-200">
              {configuredCount}/{REQUIRED_KEYS.length} keys configured
            </span>
          )}
        </div>
        <p className="text-gray-600">Generate and send personalized cold emails from any URL.</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-6">
          {[
            { id: "keys", label: "BYOK Keys", icon: "🔑" },
            { id: "campaigns", label: `Campaigns (${campaigns.length})`, icon: "📤" },
            { id: "spending", label: "Stats", icon: "📊" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              className={`
                flex items-center gap-2 pb-3 border-b-2 text-sm font-medium transition
                ${activeTab === tab.id
                  ? "border-primary-500 text-primary-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
                }
              `}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "keys" && (
        <div className="space-y-4">
          {loading ? (
            <SkeletonKeysList />
          ) : (
            REQUIRED_KEYS.map((provider) => {
              const existingKey = getKeyForProvider(provider.id);
              const isEditing = editingProvider === provider.id;

              return (
                <div
                  key={provider.id}
                  className="bg-white rounded-xl border border-gray-200 p-5"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-medium text-gray-800">{provider.name}</h3>
                      <p className="text-sm text-gray-500">{provider.description}</p>
                      {provider.helpUrl && (
                        <a 
                          href={provider.helpUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs text-primary-500 hover:text-primary-600 hover:underline"
                        >
                          {provider.helpText} →
                        </a>
                      )}
                    </div>
                    {existingKey ? (
                      <span className="text-xs bg-accent-100 text-accent-700 px-2 py-1 rounded-full border border-accent-200">
                        ✓ Configured
                      </span>
                    ) : (
                      <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full border border-red-200">
                        Required
                      </span>
                    )}
                  </div>

                  {isEditing ? (
                    <div className="flex gap-2">
                      <input
                        type="password"
                        value={newKeyValue}
                        onChange={(e) => setNewKeyValue(e.target.value)}
                        placeholder={provider.placeholder}
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary-300 focus:ring-2 focus:ring-primary-100 outline-none"
                        autoFocus
                      />
                      <button
                        onClick={() => handleSaveKey(provider.id)}
                        disabled={saving || !newKeyValue.trim()}
                        className="px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 transition disabled:opacity-50"
                      >
                        {saving ? "..." : "Save"}
                      </button>
                      <button
                        onClick={() => {
                          setEditingProvider(null);
                          setNewKeyValue("");
                        }}
                        className="px-4 py-2 text-gray-500 hover:text-gray-700 text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      {existingKey ? (
                        <code className="text-sm bg-gray-100 px-3 py-1 rounded text-gray-600">
                          {existingKey.maskedKey}
                        </code>
                      ) : (
                        <span className="text-sm text-gray-400">No key configured</span>
                      )}
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditingProvider(provider.id)}
                          className="text-sm text-primary-500 hover:text-primary-600 font-medium"
                        >
                          {existingKey ? "Update" : "Add Key"}
                        </button>
                        {existingKey && (
                          <button
                            onClick={() => handleDeleteKey(provider.id)}
                            className="text-sm text-red-500 hover:text-red-600"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {activeTab === "campaigns" && (
        <div className="space-y-4">
          {campaignsLoading ? (
            <SkeletonKeysList />
          ) : campaigns.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
              <div className="text-4xl mb-4">📤</div>
              <h3 className="font-display font-bold text-lg text-gray-800 mb-2">No campaigns yet</h3>
              <p className="text-gray-600 text-sm max-w-md mx-auto mb-4">
                Use the MCP from Claude, Cursor, or any MCP-compatible client to create your first campaign.
              </p>
              <code className="block bg-gray-900 text-gray-100 p-4 rounded-lg text-left text-sm max-w-lg mx-auto overflow-x-auto">
                {`"Create a cold email campaign targeting 
CTOs at fintech startups in California"`}
              </code>
            </div>
          ) : (
            campaigns.map((campaign) => {
              const stats = campaignStats[campaign.id];
              return (
                <div key={campaign.id} className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-medium text-gray-800">{campaign.name}</h3>
                      <p className="text-sm text-gray-500">
                        Created {formatDate(campaign.createdAt)}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full border ${getStatusColor(campaign.status)}`}>
                      {campaign.status}
                    </span>
                  </div>
                  
                  {/* Targeting info */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {campaign.personTitles?.map((title) => (
                      <span key={title} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                        {title}
                      </span>
                    ))}
                    {campaign.organizationLocations?.map((loc) => (
                      <span key={loc} className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded">
                        {loc}
                      </span>
                    ))}
                  </div>

                  {/* Stats */}
                  {stats && (
                    <div className="grid grid-cols-4 gap-4 pt-3 border-t border-gray-100">
                      <div>
                        <p className="text-xs text-gray-500">Leads</p>
                        <p className="font-medium text-gray-800">{stats.leadsFound || 0}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Sent</p>
                        <p className="font-medium text-gray-800">{stats.emailsSent || 0}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Opened</p>
                        <p className="font-medium text-gray-800">{stats.emailsOpened || 0}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Replied</p>
                        <p className="font-medium text-accent-600">{stats.emailsReplied || 0}</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {activeTab === "spending" && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-medium text-gray-800 mb-4">Overview</h3>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-500">Campaigns</p>
                <p className="text-2xl font-bold text-gray-800">{campaigns.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Emails Sent</p>
                <p className="text-2xl font-bold text-gray-800">{totalStats.emailsSent}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Opens</p>
                <p className="text-2xl font-bold text-gray-800">{totalStats.emailsOpened}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Replies</p>
                <p className="text-2xl font-bold text-accent-600">{totalStats.emailsReplied}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-medium text-gray-800 mb-4">API Usage (estimated)</h3>
            <div className="space-y-3">
              {[
                { name: "Apollo", usage: `${totalStats.emailsSent} lookups` },
                { name: "Anthropic (Claude)", usage: `${totalStats.emailsSent * 2} calls` },
              ].map((service) => (
                <div
                  key={service.name}
                  className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                >
                  <span className="text-sm text-gray-700">{service.name}</span>
                  <span className="text-sm text-gray-500">{service.usage}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
