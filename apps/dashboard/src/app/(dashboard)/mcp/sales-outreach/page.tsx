"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { getByokKeys, setByokKey, deleteByokKey, ByokKey } from "@/lib/api";
import { SkeletonKeysList } from "@/components/skeleton";

type Tab = "keys" | "requests" | "results" | "spending";

const REQUIRED_KEYS = [
  { id: "openai", name: "OpenAI", description: "For email generation (GPT-4)", placeholder: "sk-..." },
  { id: "apollo", name: "Apollo", description: "For lead finding", placeholder: "api_..." },
  { id: "resend", name: "Resend", description: "For email sending", placeholder: "re_..." },
];

export default function SalesOutreachPage() {
  const { getToken } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("keys");
  const [keys, setKeys] = useState<ByokKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProvider, setEditingProvider] = useState<string | null>(null);
  const [newKeyValue, setNewKeyValue] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadKeys();
  }, []);

  async function loadKeys() {
    try {
      const token = await getToken();
      if (!token) return;
      const data = await getByokKeys(token);
      setKeys(data.keys);
    } catch (err) {
      console.error("Failed to load keys:", err);
    } finally {
      setLoading(false);
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

  const configuredCount = REQUIRED_KEYS.filter((k) => getKeyForProvider(k.id)).length;
  const isFullyConfigured = configuredCount === REQUIRED_KEYS.length;

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
            { id: "requests", label: "Requests", icon: "📤" },
            { id: "results", label: "Results", icon: "📊" },
            { id: "spending", label: "Spending", icon: "💰" },
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

      {activeTab === "requests" && (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <div className="text-4xl mb-4">📤</div>
          <h3 className="font-display font-bold text-lg text-gray-800 mb-2">No requests yet</h3>
          <p className="text-gray-600 text-sm max-w-md mx-auto mb-4">
            Use the MCP from Claude, Cursor, or any MCP-compatible client to send your first request.
          </p>
          <code className="block bg-gray-900 text-gray-100 p-4 rounded-lg text-left text-sm max-w-lg mx-auto overflow-x-auto">
            {`"Launch a cold email campaign for acme.com, 
$10/day budget, 5 days trial"`}
          </code>
        </div>
      )}

      {activeTab === "results" && (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <div className="text-4xl mb-4">📊</div>
          <h3 className="font-display font-bold text-lg text-gray-800 mb-2">No results yet</h3>
          <p className="text-gray-600 text-sm max-w-md mx-auto">
            Results will appear here once you start sending emails through the MCP.
          </p>
        </div>
      )}

      {activeTab === "spending" && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-medium text-gray-800 mb-4">This Month</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-500">Total Spent</p>
                <p className="text-2xl font-bold text-gray-800">$0.00</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Emails Sent</p>
                <p className="text-2xl font-bold text-gray-800">0</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Cost per Email</p>
                <p className="text-2xl font-bold text-gray-800">—</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-medium text-gray-800 mb-4">Breakdown by Service</h3>
            <div className="space-y-3">
              {[
                { name: "OpenAI (GPT-4)", spent: "$0.00", usage: "0 tokens" },
                { name: "Apollo", spent: "$0.00", usage: "0 lookups" },
                { name: "Resend", spent: "$0.00", usage: "0 emails" },
              ].map((service) => (
                <div
                  key={service.name}
                  className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                >
                  <span className="text-sm text-gray-700">{service.name}</span>
                  <div className="text-right">
                    <span className="text-sm font-medium text-gray-800">{service.spent}</span>
                    <span className="text-xs text-gray-500 ml-2">({service.usage})</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
