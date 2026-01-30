"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { UserButton, useAuth } from "@clerk/nextjs";
import { getByokKeys, setByokKey, deleteByokKey, ByokKey } from "@/lib/api";

const PROVIDERS = [
  {
    id: "openai",
    name: "OpenAI",
    description: "For email generation (GPT-4)",
    placeholder: "sk-...",
  },
  {
    id: "anthropic",
    name: "Anthropic",
    description: "Alternative for email generation (Claude)",
    placeholder: "sk-ant-...",
  },
  {
    id: "apollo",
    name: "Apollo",
    description: "For lead finding and enrichment",
    placeholder: "api_...",
  },
  {
    id: "resend",
    name: "Resend",
    description: "For email sending",
    placeholder: "re_...",
  },
];

export default function KeysSettingsPage() {
  const { getToken } = useAuth();
  const [keys, setKeys] = useState<ByokKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProvider, setEditingProvider] = useState<string | null>(null);
  const [newKeyValue, setNewKeyValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    setError(null);

    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");

      await setByokKey(token, provider, newKeyValue);
      await loadKeys();
      setEditingProvider(null);
      setNewKeyValue("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save key");
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
      setError(err instanceof Error ? err.message : "Failed to delete key");
    }
  }

  function getKeyForProvider(provider: string): ByokKey | undefined {
    return keys.find((k) => k.provider === provider);
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
            <span className="text-gray-600">BYOK Keys</span>
          </div>
          <UserButton afterSignOutUrl="/sign-in" />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="font-display text-2xl font-bold text-gray-800">BYOK Keys</h1>
          <p className="text-gray-600">
            Configure your API keys. Keys are encrypted and stored securely.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : (
          <div className="space-y-4">
            {PROVIDERS.map((provider) => {
              const existingKey = getKeyForProvider(provider.id);
              const isEditing = editingProvider === provider.id;

              return (
                <div
                  key={provider.id}
                  className="bg-white rounded-2xl border border-gray-200 p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-display font-bold text-lg text-gray-800">
                        {provider.name}
                      </h3>
                      <p className="text-sm text-gray-600">{provider.description}</p>
                    </div>
                    {existingKey ? (
                      <span className="text-xs bg-accent-100 text-accent-700 px-2 py-1 rounded-full border border-accent-200">
                        Configured
                      </span>
                    ) : (
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full">
                        Not configured
                      </span>
                    )}
                  </div>

                  {isEditing ? (
                    <div className="space-y-3">
                      <input
                        type="password"
                        value={newKeyValue}
                        onChange={(e) => setNewKeyValue(e.target.value)}
                        placeholder={provider.placeholder}
                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:border-primary-300 focus:ring-2 focus:ring-primary-100 outline-none"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSaveKey(provider.id)}
                          disabled={saving || !newKeyValue.trim()}
                          className="px-4 py-2 bg-primary-500 text-white rounded-full font-medium hover:bg-primary-600 transition disabled:opacity-50"
                        >
                          {saving ? "Saving..." : "Save"}
                        </button>
                        <button
                          onClick={() => {
                            setEditingProvider(null);
                            setNewKeyValue("");
                          }}
                          className="px-4 py-2 text-gray-600 hover:text-gray-800 transition"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      {existingKey ? (
                        <code className="text-sm bg-gray-100 px-3 py-1 rounded-lg text-gray-600">
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
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
