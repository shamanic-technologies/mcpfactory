import Link from "next/link";

export default function DashboardHome() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-xl">MCP Factory</span>
            <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded">
              Dashboard
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/settings" className="text-gray-600 hover:text-gray-900">
              Settings
            </Link>
            <button className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm">
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
          <p className="text-gray-600">Manage your MCPs, BYOK keys, and campaigns.</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm text-gray-500">API Key</p>
            <p className="font-mono text-sm mt-1">mcpf_••••••••</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Plan</p>
            <p className="font-bold text-primary-600">Free</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Usage This Month</p>
            <p className="font-bold">0 / 1,000</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm text-gray-500">BYOK Cost</p>
            <p className="font-bold">$0.00</p>
          </div>
        </div>

        {/* BYOK Keys Section */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">BYOK Keys</h2>
            <Link
              href="/settings/keys"
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              Manage Keys →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">OpenAI</span>
                <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">
                  Not configured
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">For email generation</p>
            </div>
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">Apollo</span>
                <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">
                  Not configured
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">For lead enrichment</p>
            </div>
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">Resend</span>
                <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">
                  Not configured
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">For email sending</p>
            </div>
          </div>
        </div>

        {/* Campaigns Section */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Recent Campaigns</h2>
            <Link
              href="/campaigns"
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              View All →
            </Link>
          </div>
          <div className="text-center py-12 text-gray-500">
            <p className="mb-2">No campaigns yet</p>
            <p className="text-sm">
              Use any MCP from Claude, Cursor, or your favorite AI tool to start a campaign.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
