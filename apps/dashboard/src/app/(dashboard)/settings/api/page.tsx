"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { getProfile, regenerateApiKey, UserProfile } from "@/lib/api";

export default function ApiSettingsPage() {
  const { getToken } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      const token = await getToken();
      if (!token) return;
      const data = await getProfile(token);
      setProfile(data);
    } catch (err) {
      console.error("Failed to load profile:", err);
      setError(err instanceof Error ? err.message : "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }

  async function handleRegenerate() {
    if (!confirm("Regenerate API key? Your current key will stop working immediately.")) return;
    setRegenerating(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      const data = await regenerateApiKey(token);
      setProfile((prev) => (prev ? { ...prev, apiKey: data.apiKey } : null));
      setShowKey(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to regenerate key");
    } finally {
      setRegenerating(false);
    }
  }

  function handleCopy() {
    if (!profile?.apiKey) return;
    navigator.clipboard.writeText(profile.apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function maskApiKey(key: string): string {
    if (key.length <= 12) return "••••••••••••";
    return `${key.slice(0, 8)}${"•".repeat(24)}${key.slice(-8)}`;
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href="/settings" className="hover:text-primary-600">Settings</Link>
          <span>/</span>
          <span className="text-gray-700">API Key</span>
        </div>
        <h1 className="font-display text-2xl font-bold text-gray-800">API Key</h1>
        <p className="text-gray-600">Your API key is used to authenticate MCP requests.</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : profile ? (
        <div className="space-y-6 max-w-2xl">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-800">Your API Key</h3>
              <span className="text-xs bg-accent-100 text-accent-700 px-2 py-1 rounded-full border border-accent-200">
                {profile.plan === "free" ? "Free Plan" : "Pro Plan"}
              </span>
            </div>

            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <div className="flex items-center justify-between">
                <code className="font-mono text-sm text-gray-700">
                  {showKey ? profile.apiKey : maskApiKey(profile.apiKey)}
                </code>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowKey(!showKey)}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    {showKey ? "Hide" : "Show"}
                  </button>
                  <button
                    onClick={handleCopy}
                    className="text-sm text-primary-500 hover:text-primary-600 font-medium"
                  >
                    {copied ? "Copied!" : "Copy"}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">
                Created {new Date(profile.createdAt).toLocaleDateString()}
              </span>
              <button
                onClick={handleRegenerate}
                disabled={regenerating}
                className="text-red-500 hover:text-red-600 font-medium disabled:opacity-50"
              >
                {regenerating ? "Regenerating..." : "Regenerate Key"}
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-medium text-gray-800 mb-4">How to Use</h3>
            <div className="space-y-4 text-sm">
              <div>
                <p className="font-medium text-gray-700 mb-2">Add to your MCP config:</p>
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-xs">
{`{
  "mcpServers": {
    "sales-outreach": {
      "command": "npx",
      "args": ["@mcpfactory/sales-outreach"],
      "env": {
        "MCPFACTORY_API_KEY": "${showKey ? profile.apiKey : "mcpf_your_key_here"}"
      }
    }
  }
}`}
                </pre>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">Failed to load profile</div>
      )}
    </div>
  );
}
