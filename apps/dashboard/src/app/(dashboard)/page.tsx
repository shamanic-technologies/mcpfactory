import { currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import { LinkButton } from "@/components/link-button";
import { ApiKeyPreview } from "@/components/api-key-preview";

export default async function DashboardHome() {
  const user = await currentUser();

  return (
    <div className="p-4 md:p-8">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-gray-800">
          Welcome{user?.firstName ? `, ${user.firstName}` : ""} 👋
        </h1>
        <p className="text-gray-600">Select an MCP from the sidebar to get started.</p>
      </div>

      {/* API Key Section */}
      <div className="mb-8 max-w-md">
        <ApiKeyPreview />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="text-3xl mb-3">📧</div>
          <h3 className="font-display font-bold text-lg text-gray-800 mb-2">Sales Cold Emails</h3>
          <p className="text-sm text-gray-600 mb-4">
            Generate and send personalized cold emails from any URL.
          </p>
          <LinkButton
            href="/mcp/sales-outreach"
            className="text-primary-500 hover:text-primary-600 font-medium text-sm"
          >
            Get Started →
          </LinkButton>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 opacity-60">
          <div className="text-3xl mb-3">🎙️</div>
          <h3 className="font-display font-bold text-lg text-gray-800 mb-2">Influencer Pitch</h3>
          <p className="text-sm text-gray-600 mb-4">
            Find and pitch relevant influencers for your brand.
          </p>
          <span className="inline-flex items-center gap-2 text-gray-400 text-sm">
            Coming Soon
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 opacity-60">
          <div className="text-3xl mb-3">📰</div>
          <h3 className="font-display font-bold text-lg text-gray-800 mb-2">Journalist Pitch</h3>
          <p className="text-sm text-gray-600 mb-4">
            Pitch journalists for press coverage and announcements.
          </p>
          <span className="inline-flex items-center gap-2 text-gray-400 text-sm">
            Coming Soon
          </span>
        </div>
      </div>

      <div className="mt-8 bg-primary-50 rounded-2xl border border-primary-200 p-6">
        <h3 className="font-display font-bold text-lg text-primary-800 mb-2">Quick Setup</h3>
        <ol className="space-y-2 text-sm text-primary-700">
          <li className="flex items-start gap-2">
            <span className="bg-primary-200 text-primary-800 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
            <span>Create your API key above or in <Link href="/api-keys" className="underline">API Keys</Link></span>
          </li>
          <li className="flex items-start gap-2">
            <span className="bg-primary-200 text-primary-800 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
            <span>Configure BYOK keys in <Link href="/mcp/sales-outreach" className="underline">Sales Cold Emails → BYOK Keys</Link></span>
          </li>
          <li className="flex items-start gap-2">
            <span className="bg-primary-200 text-primary-800 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">3</span>
            <span>Use the MCP in Claude, Cursor, or any MCP-compatible client</span>
          </li>
        </ol>
      </div>
    </div>
  );
}
