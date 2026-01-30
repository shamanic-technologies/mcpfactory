import Image from "next/image";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { currentUser } from "@clerk/nextjs/server";

export default async function DashboardHome() {
  const user = await currentUser();

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-secondary-50/30">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-secondary-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image src="/logo.jpg" alt="MCP Factory" width={32} height={32} className="rounded-md" />
            <span className="font-display font-bold text-xl text-primary-600">MCP Factory</span>
            <span className="text-xs bg-secondary-100 text-secondary-600 px-2 py-0.5 rounded-full border border-secondary-200">
              Dashboard
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/settings" className="text-gray-600 hover:text-primary-600 text-sm transition">
              Settings
            </Link>
            <UserButton afterSignOutUrl="/sign-in" />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="font-display text-2xl font-bold text-gray-800">
            Welcome back{user?.firstName ? `, ${user.firstName}` : ""} 👋
          </h1>
          <p className="text-gray-600">Manage your MCPs, BYOK keys, and campaigns.</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
            <p className="text-sm text-gray-500">API Key</p>
            <p className="font-mono text-sm mt-1 text-gray-700">mcpf_••••••••</p>
          </div>
          <div className="bg-white rounded-2xl border border-primary-200 p-4 shadow-sm">
            <p className="text-sm text-gray-500">Plan</p>
            <p className="font-display font-bold text-primary-600">Free</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
            <p className="text-sm text-gray-500">Usage This Month</p>
            <p className="font-bold text-gray-800">0 / 1,000</p>
          </div>
          <div className="bg-white rounded-2xl border border-accent-200 p-4 shadow-sm">
            <p className="text-sm text-gray-500">BYOK Cost</p>
            <p className="font-bold text-accent-600">$0.00</p>
          </div>
        </div>

        {/* BYOK Keys Section */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-8 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-bold text-gray-800">BYOK Keys</h2>
            <Link
              href="/settings/keys"
              className="text-sm text-primary-500 hover:text-primary-600 font-medium transition"
            >
              Manage Keys →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border border-gray-200 rounded-xl p-4 hover:border-primary-200 transition">
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-800">OpenAI</span>
                <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full border border-red-200">
                  Not configured
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">For email generation</p>
            </div>
            <div className="border border-gray-200 rounded-xl p-4 hover:border-primary-200 transition">
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-800">Apollo</span>
                <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full border border-red-200">
                  Not configured
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">For lead enrichment</p>
            </div>
            <div className="border border-gray-200 rounded-xl p-4 hover:border-primary-200 transition">
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-800">Resend</span>
                <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full border border-red-200">
                  Not configured
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">For email sending</p>
            </div>
          </div>
        </div>

        {/* Campaigns Section */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-bold text-gray-800">Recent Campaigns</h2>
            <Link
              href="/campaigns"
              className="text-sm text-primary-500 hover:text-primary-600 font-medium transition"
            >
              View All →
            </Link>
          </div>
          <div className="text-center py-12 text-gray-500 bg-secondary-50/50 rounded-xl border border-dashed border-secondary-200">
            <div className="text-4xl mb-3">🚀</div>
            <p className="mb-2 font-medium text-gray-700">No campaigns yet</p>
            <p className="text-sm max-w-md mx-auto">
              Use any MCP from Claude, Cursor, or your favorite AI tool to start a campaign.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
