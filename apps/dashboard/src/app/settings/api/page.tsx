"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { UserButton, useAuth } from "@clerk/nextjs";
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
    if (!confirm("Regenerate API key? Your current key will stop working immediately.")) {
      return;
    }

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
    <div className="min-h-screen bg-gradient-to-b from-white to-secondary-50/30">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-secondary-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2">
              <Image src="/logo.jpg" alt="MCP Factory" width={32} height={32} className="rounded-md" />
              <span className="font-display font-bold text-xl text-primary-600">MCP Factory</span>
            </Link>
            <span className="text-gray-400">/</span>
            <Link href="/settings" className="text-gray-600 hover:text-primary-600">Settings</Link>
            <span className="text-gray-400">/</span>
            <span className="text-gray-600">API Key</span>
          </div>
          <UserButton afterSignOutUrl="/sign-in" />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="font-display text-2xl font-bold text-gray-800">API Key</h1>
          <p className="text-gray-600">
            Your API key is used to authenticate MCP requests.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : profile ? (
          <div className="space-y-6">
            {/* API Key Card */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-bold text-lg text-gray-800">
                  Your API Key
                </h3>
                <span className="text-xs bg-accent-100 text-accent-700 px-2 py-1 rounded-full border border-accent-200">
                  {profile.plan === "free" ? "Free Plan" : "Pro Plan"}
                </span>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 mb-4">
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

              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  Created {new Date(profile.createdAt).toLocaleDateString()}
                </p>
                <button
                  onClick={handleRegenerate}
                  disabled={regenerating}
                  className="text-sm text-red-500 hover:text-red-600 font-medium disabled:opacity-50"
                >
                  {regenerating ? "Regenerating..." : "Regenerate Key"}
                </button>
              </div>
            </div>

            {/* Usage Card */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h3 className="font-display font-bold text-lg text-gray-800 mb-4">
                How to Use
              </h3>
              <div className="space-y-4 text-sm">
                <div>
                  <p className="font-medium text-gray-700 mb-2">1. Add to your MCP config:</p>
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded-xl overflow-x-auto">
                    <code>{`{
  "mcpServers": {
    "sales-outreach": {
      "command": "npx",
      "args": ["@mcpfactory/sales-outreach"],
      "env": {
        "MCPFACTORY_API_KEY": "${showKey ? profile.apiKey : "mcpf_your_key_here"}"
      }
    }
  }
}`}</code>
                  </pre>
                </div>
                <div>
                  <p className="font-medium text-gray-700 mb-2">2. Or set as environment variable:</p>
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded-xl overflow-x-auto">
                    <code>{`export MCPFACTORY_API_KEY="${showKey ? profile.apiKey : "mcpf_your_key_here"}"`}</code>
                  </pre>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            Failed to load profile
          </div>
        )}
      </main>
    </div>
  );
}
