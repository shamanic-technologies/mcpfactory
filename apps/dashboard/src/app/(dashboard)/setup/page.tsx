"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import Link from "next/link";

interface ByokKey {
  provider: string;
  createdAt: string;
  lastUsedAt: string | null;
}

const PROVIDERS = [
  {
    id: "anthropic",
    name: "Anthropic",
    description: "For Claude models (email generation, research)",
    placeholder: "sk-ant-...",
    getKeyUrl: "https://console.anthropic.com/settings/keys",
  },
  {
    id: "apollo",
    name: "Apollo",
    description: "For lead enrichment and contact discovery",
    placeholder: "...",
    getKeyUrl: "https://app.apollo.io/#/settings/integrations/api",
  },
];

const MCPS = [
  {
    id: "sales-outreach",
    name: "Sales Cold Emails",
    icon: "📧",
    requiredProviders: ["anthropic", "apollo"], // All required
  },
];

export default function SetupPage() {
  const { getToken } = useAuth();
  const [keys, setKeys] = useState<ByokKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [newKeys, setNewKeys] = useState<Record<string, string>>({});

  useEffect(() => {
    loadKeys();
  }, []);

  async function loadKeys() {
    try {
      const token = await getToken();
      if (!token) return;
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/keys`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.ok) {
        const data = await res.json();
        setKeys(data.keys || []);
      }
    } catch (err) {
      console.error("Failed to load keys:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveKey(provider: string) {
    const apiKey = newKeys[provider];
    if (!apiKey?.trim()) return;

    setSaving(provider);
    setError(null);
    setSuccess(null);

    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/keys`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ provider, apiKey: apiKey.trim() }),
        }
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save key");
      }

      setSuccess(`${provider} key saved successfully`);
      setNewKeys((prev) => ({ ...prev, [provider]: "" }));
      await loadKeys();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save key");
    } finally {
      setSaving(null);
    }
  }

  async function handleDeleteKey(provider: string) {
    if (!confirm(`Remove ${provider} key? This will affect all MCPs using this provider.`)) return;

    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/keys/${provider}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete key");
      }

      await loadKeys();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete key");
    }
  }

  const hasKey = (provider: string) => keys.some((k) => k.provider === provider);

  const getMcpStatus = (mcp: typeof MCPS[0]) => {
    const hasAllKeys = mcp.requiredProviders.every((p) => hasKey(p));
    return hasAllKeys ? "ready" : "needs-setup";
  };

  if (loading) {
    return (
      <div className="p-4 md:p-8">
        <div className="animate-pulse space-y-4 max-w-2xl">
          <div className="h-8 bg-gray-200 rounded w-48"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Setup</h1>
        <p className="text-gray-600">Configure your AI provider keys to enable MCPs.</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6 text-sm">
          {success}
        </div>
      )}

      {/* BYOK Keys Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
        <h2 className="text-lg font-medium text-gray-900 mb-1">AI Provider Keys</h2>
        <p className="text-sm text-gray-500 mb-6">
          Bring your own API keys. Keys are encrypted and shared across all MCPs in your organization.
        </p>

        <div className="space-y-6">
          {PROVIDERS.map((provider) => {
            const existingKey = keys.find((k) => k.provider === provider.id);
            const isConfigured = !!existingKey;

            return (
              <div key={provider.id} className="border-b border-gray-100 pb-6 last:border-0 last:pb-0">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-gray-900">{provider.name}</h3>
                      {isConfigured ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                          <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                          Configured
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                          Not configured
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">{provider.description}</p>
                    {!isConfigured && (
                      <a
                        href={provider.getKeyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary-600 hover:text-primary-700 hover:underline"
                      >
                        Get API key →
                      </a>
                    )}
                  </div>
                  {isConfigured && (
                    <button
                      onClick={() => handleDeleteKey(provider.id)}
                      className="text-sm text-red-500 hover:text-red-600"
                    >
                      Remove
                    </button>
                  )}
                </div>

                {!isConfigured && (
                  <div className="flex gap-2">
                    <input
                      type="password"
                      placeholder={provider.placeholder}
                      value={newKeys[provider.id] || ""}
                      onChange={(e) => setNewKeys((prev) => ({ ...prev, [provider.id]: e.target.value }))}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                    <button
                      onClick={() => handleSaveKey(provider.id)}
                      disabled={!newKeys[provider.id]?.trim() || saving === provider.id}
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 text-sm font-medium"
                    >
                      {saving === provider.id ? "Saving..." : "Save"}
                    </button>
                  </div>
                )}

                {existingKey?.lastUsedAt && (
                  <p className="text-xs text-gray-400 mt-2">
                    Last used {new Date(existingKey.lastUsedAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* MCP Status Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-1">MCP Status</h2>
        <p className="text-sm text-gray-500 mb-6">
          Each MCP requires specific provider keys to function.
        </p>

        <div className="space-y-4">
          {MCPS.map((mcp) => {
            const status = getMcpStatus(mcp);
            const isReady = status === "ready";

            return (
              <div
                key={mcp.id}
                className={`flex items-center justify-between p-4 rounded-lg border ${
                  isReady ? "border-green-200 bg-green-50" : "border-gray-200 bg-gray-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{mcp.icon}</span>
                  <div>
                    <h3 className="font-medium text-gray-900">{mcp.name}</h3>
                    <p className="text-sm text-gray-500">
                      Requires: {mcp.requiredProviders.map((p) => PROVIDERS.find((pr) => pr.id === p)?.name).join(" + ")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {isReady ? (
                    <>
                      <span className="inline-flex items-center gap-1.5 text-sm text-green-700">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Ready
                      </span>
                      <Link
                        href="/brands"
                        className="px-3 py-1.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium"
                      >
                        Use MCP
                      </Link>
                    </>
                  ) : (
                    <span className="text-sm text-gray-500">Add a key above to enable</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
