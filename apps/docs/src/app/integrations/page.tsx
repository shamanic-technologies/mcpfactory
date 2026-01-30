import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Integrations",
  description: "Connect MCP Factory to Cursor, n8n, Zapier, Make.com, and more. Automate workflows with webhooks and REST API.",
  openGraph: {
    title: "Integrations | MCP Factory Docs",
    description: "Connect MCP Factory to your favorite tools.",
  },
};

const INTEGRATIONS = [
  {
    name: "Cursor Skill",
    description: "Use MCP Factory as a Cursor skill for AI-assisted development workflows.",
    href: "/integrations/cursor-skill",
    icon: "🖥️",
  },
  {
    name: "n8n",
    description: "Build automated workflows with n8n using HTTP requests or custom nodes.",
    href: "/integrations/n8n",
    icon: "🔄",
  },
  {
    name: "Zapier",
    description: "Connect MCP Factory to 5,000+ apps with Zapier automations.",
    href: "/integrations/zapier",
    icon: "⚡",
  },
  {
    name: "Make.com",
    description: "Create visual automation scenarios with Make.com integration.",
    href: "/integrations/make",
    icon: "🔧",
  },
];

export default function IntegrationsPage() {
  return (
    <div className="max-w-3xl mx-auto px-8 py-12">
      <h1 className="text-4xl font-bold mb-4">Integrations</h1>
      <p className="text-xl text-gray-600 mb-8">
        Connect MCP Factory to your favorite tools and platforms.
      </p>

      <div className="grid gap-4">
        {INTEGRATIONS.map((integration) => (
          <Link
            key={integration.name}
            href={integration.href}
            className="block p-6 border border-gray-200 rounded-lg hover:border-primary-500 hover:shadow-md transition"
          >
            <div className="flex items-start gap-4">
              <span className="text-3xl">{integration.icon}</span>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {integration.name}
                </h3>
                <p className="text-gray-600 mt-1">{integration.description}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="prose prose-lg mt-12">
        <h2>Integration Methods</h2>
        <p>MCP Factory can be integrated in three ways:</p>

        <h3>1. MCP Protocol (Recommended)</h3>
        <p>
          Use our MCPs directly from Claude, Cursor, or any MCP-compatible
          client. This is the most powerful option with full DFY automation.
        </p>

        <h3>2. REST API</h3>
        <p>
          Call our REST API from any platform that supports HTTP requests. See
          the <Link href="/api">API Reference</Link> for details.
        </p>

        <h3>3. Webhooks</h3>
        <p>
          Receive real-time updates when campaigns change status, reach
          milestones, or complete. Configure webhooks in your dashboard.
        </p>

        <h2>Need Help?</h2>
        <p>
          If you need help integrating MCP Factory with your stack, reach out at{" "}
          <a href="mailto:support@mcpfactory.org">support@mcpfactory.org</a>.
        </p>
      </div>
    </div>
  );
}
