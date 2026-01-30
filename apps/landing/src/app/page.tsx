import { WaitlistForm } from "@/components/waitlist-form";
import { McpCard } from "@/components/mcp-card";

const DASHBOARD_URL = process.env.NEXT_PUBLIC_DASHBOARD_URL || "https://app.mcpfactory.org";

const MCPS = [
  {
    name: "Sales Outreach",
    package: "@mcpfactory/sales-outreach",
    description: "Cold email campaigns from your URL. Find leads, generate emails, send & optimize.",
    freeQuota: "1,000 emails",
    isAvailable: true,
  },
  {
    name: "Influencer Pitch",
    package: "@mcpfactory/influencer-pitch",
    description: "Find and pitch relevant influencers automatically.",
    freeQuota: "500 pitches",
    isAvailable: false,
  },
  {
    name: "Thought Leader",
    package: "@mcpfactory/thought-leader",
    description: "Get featured in publications as an industry expert.",
    freeQuota: "500 pitches",
    isAvailable: false,
  },
  {
    name: "Podcaster Pitch",
    package: "@mcpfactory/podcaster-pitch",
    description: "Get booked as a guest on relevant podcasts.",
    freeQuota: "500 pitches",
    isAvailable: false,
  },
  {
    name: "Journalist Pitch",
    package: "@mcpfactory/journalist-pitch",
    description: "Pitch journalists about your announcements.",
    freeQuota: "500 pitches",
    isAvailable: false,
  },
  {
    name: "Google Ads",
    package: "@mcpfactory/google-ads",
    description: "Create and optimize Google Ads campaigns automatically.",
    freeQuota: "100 campaigns",
    isAvailable: false,
  },
  {
    name: "Reddit Ads",
    package: "@mcpfactory/reddit-ads",
    description: "Create and optimize Reddit Ads campaigns automatically.",
    freeQuota: "100 campaigns",
    isAvailable: false,
  },
];

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Navbar */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-xl">MCP Factory</span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/shamanic-technologies/mcpfactory"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-gray-900 text-sm"
            >
              GitHub
            </a>
            <a
              href={`${DASHBOARD_URL}/sign-in`}
              className="text-gray-600 hover:text-gray-900 text-sm font-medium"
            >
              Sign In
            </a>
            <a
              href={`${DASHBOARD_URL}/sign-up`}
              className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition"
            >
              Get Started
            </a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-gradient-to-b from-primary-50 to-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-block bg-primary-100 text-primary-700 px-4 py-1 rounded-full text-sm font-medium mb-6">
            100% Open Source
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            From URL to Revenue
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-4">
            The <span className="font-semibold text-primary-600">DFY</span>,{" "}
            <span className="font-semibold text-primary-600">BYOK</span> MCP Platform
          </p>
          <p className="text-lg text-gray-500 mb-8 max-w-2xl mx-auto">
            You give us your URL + budget. We handle lead finding, content generation,
            outreach, optimization, and reporting. All via MCP.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <a
              href={`${DASHBOARD_URL}/sign-up`}
              className="inline-flex items-center justify-center px-8 py-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-medium text-lg"
            >
              Get Started Free
            </a>
            <a
              href="https://github.com/shamanic-technologies/mcpfactory"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-6 py-4 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
              View on GitHub
            </a>
          </div>

          {/* Pricing badges */}
          <div className="flex flex-wrap gap-4 justify-center">
            <div className="bg-white border border-gray-200 rounded-lg px-4 py-2 shadow-sm">
              <span className="text-gray-500 text-sm">Free tier</span>
              <span className="block font-bold text-gray-900">$0 + BYOK costs</span>
            </div>
            <div className="bg-white border border-primary-200 rounded-lg px-4 py-2 shadow-sm">
              <span className="text-primary-600 text-sm">Pro</span>
              <span className="block font-bold text-gray-900">$20/mo</span>
            </div>
          </div>
        </div>
      </section>

      {/* What is DFY + BYOK */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">What makes us different?</h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-gray-50 rounded-xl p-6">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">🎯</span>
              </div>
              <h3 className="text-xl font-bold mb-2">DFY (Done For You)</h3>
              <p className="text-gray-600 mb-4">
                Competitors give you tools. We do the work.
              </p>
              <div className="text-sm text-gray-500 space-y-1">
                <p>You say: <span className="font-mono bg-gray-200 px-1">"acme.com, $10/day"</span></p>
                <p>We: Find leads → Generate emails → Send → Optimize → Report</p>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-xl p-6">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">🔑</span>
              </div>
              <h3 className="text-xl font-bold mb-2">BYOK (Bring Your Own Keys)</h3>
              <p className="text-gray-600 mb-4">
                Use your own API keys. Pay only for what you use.
              </p>
              <div className="text-sm text-gray-500 space-y-1">
                <p>~$0.02/email (OpenAI + Apollo + Resend)</p>
                <p>No hidden markups. Full transparency.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MCPs Grid */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">Available MCPs</h2>
          <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            Install any MCP and start automating. All work via Claude, Cursor, or any MCP-compatible client.
          </p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {MCPS.map((mcp) => (
              <McpCard key={mcp.package} {...mcp} />
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">How it works</h2>
          
          <div className="space-y-8">
            <div className="flex gap-4">
              <div className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold shrink-0">
                1
              </div>
              <div>
                <h3 className="font-bold text-lg">Install the MCP</h3>
                <code className="text-sm bg-gray-100 px-2 py-1 rounded">npx @mcpfactory/sales-outreach</code>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold shrink-0">
                2
              </div>
              <div>
                <h3 className="font-bold text-lg">Configure your BYOK keys</h3>
                <p className="text-gray-600">Add your OpenAI, Apollo, Resend keys in the dashboard</p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold shrink-0">
                3
              </div>
              <div>
                <h3 className="font-bold text-lg">Launch from Claude/Cursor</h3>
                <p className="text-gray-600 italic">
                  "Launch a cold email campaign for acme.com, $10/day, 5 days trial, report to ceo@acme.com"
                </p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold shrink-0">
                4
              </div>
              <div>
                <h3 className="font-bold text-lg">We do everything else</h3>
                <p className="text-gray-600">Lead finding, email generation, sending, A/B testing, optimization, reporting</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Waitlist */}
      <section id="waitlist" className="py-20 px-4 bg-gradient-to-b from-white to-primary-50">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Join the Waitlist</h2>
          <p className="text-gray-600 mb-8">
            Be the first to know when we launch. Get early access + lifetime discount.
          </p>
          <WaitlistForm />
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="font-bold text-white mb-2">MCP Factory</p>
          <p className="text-sm mb-4">The DFY, BYOK MCP Platform</p>
          <div className="flex justify-center gap-6 text-sm">
            <a
              href="https://github.com/shamanic-technologies/mcpfactory"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition"
            >
              GitHub
            </a>
            <a href="#" className="hover:text-white transition">
              Documentation
            </a>
            <a href="#" className="hover:text-white transition">
              Privacy
            </a>
          </div>
          <p className="text-xs mt-8">MIT License. 100% Open Source.</p>
        </div>
      </footer>
    </main>
  );
}
