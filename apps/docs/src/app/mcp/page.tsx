import { Metadata } from "next";

export const metadata: Metadata = {
  title: "MCP Usage Guide",
  description: "Learn how to use MCP Factory tools from ChatGPT, Claude, Cursor, or any MCP-compatible client. Configuration and best practices.",
  openGraph: {
    title: "MCP Usage Guide | MCP Factory Docs",
    description: "Complete guide to using MCP Factory from any MCP client.",
  },
};

export default function McpUsagePage() {
  return (
    <div className="max-w-3xl mx-auto px-8 py-12">
      <h1 className="text-4xl font-bold mb-4">MCP Usage</h1>
      <p className="text-xl text-gray-600 mb-8">
        How to use MCP Factory tools from any MCP-compatible client.
      </p>

      <div className="prose prose-lg">
        <h2>What is MCP?</h2>
        <p>
          The <strong>Model Context Protocol (MCP)</strong> is an open standard
          that allows AI assistants to connect to external tools and data
          sources. MCP Factory provides a suite of DFY automation tools
          accessible via MCP.
        </p>

        <h2>MCP Endpoint</h2>
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg">
          <code>https://mcp.mcpfactory.org/mcp</code>
        </pre>

        <h2>Supported Clients</h2>
        <ul>
          <li><strong>ChatGPT</strong> - OpenAI&apos;s chat interface (Pro, Plus, Team, Enterprise)</li>
          <li><strong>Claude.ai</strong> - Anthropic&apos;s web interface</li>
          <li><strong>Claude Desktop</strong> - Anthropic&apos;s desktop app</li>
          <li><strong>Claude Code</strong> - Anthropic&apos;s coding assistant</li>
          <li><strong>Cursor</strong> - AI-powered IDE</li>
          <li><strong>Any MCP-compatible client</strong></li>
        </ul>

        <h2>Installation</h2>

        <h3>ChatGPT</h3>
        <ol>
          <li>Go to <strong>Settings → Connectors</strong></li>
          <li>Click <strong>Add Custom Connector</strong></li>
          <li>Enter the MCP URL: <code>https://mcp.mcpfactory.org/mcp</code></li>
          <li>Add your API key in the Authorization header</li>
        </ol>

        <h3>Claude.ai / Claude Desktop</h3>
        <ol>
          <li>Go to <strong>Settings → Connectors</strong></li>
          <li>Click <strong>Add</strong></li>
          <li>Enter the MCP URL: <code>https://mcp.mcpfactory.org/mcp</code></li>
          <li>Configure authentication with your API key</li>
        </ol>

        <h3>Cursor</h3>
        <p>
          Add to your <code>.cursor/mcp.json</code> in your project or globally:
        </p>
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          <code>{`{
  "mcpServers": {
    "mcpfactory-sales": {
      "url": "https://mcp.mcpfactory.org/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_API_KEY"
      }
    }
  }
}`}</code>
        </pre>

        <h3>Claude Code</h3>
        <p>
          Add to your <code>.mcp.json</code> configuration:
        </p>
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          <code>{`{
  "mcpServers": {
    "mcpfactory-sales": {
      "url": "https://mcp.mcpfactory.org/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_API_KEY"
      }
    }
  }
}`}</code>
        </pre>

        <h2>Available Tools</h2>
        <table>
          <thead>
            <tr>
              <th>Tool</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>mcpfactory_status</code></td>
              <td>Check connection status and configuration</td>
            </tr>
            <tr>
              <td><code>mcpfactory_scrape_company</code></td>
              <td>Extract company info from a URL</td>
            </tr>
            <tr>
              <td><code>mcpfactory_search_leads</code></td>
              <td>Find leads matching criteria via Apollo</td>
            </tr>
            <tr>
              <td><code>mcpfactory_qualify_reply</code></td>
              <td>Classify email replies with AI</td>
            </tr>
            <tr>
              <td><code>mcpfactory_create_campaign</code></td>
              <td>Create a cold email campaign</td>
            </tr>
            <tr>
              <td><code>mcpfactory_list_campaigns</code></td>
              <td>List all your campaigns</td>
            </tr>
            <tr>
              <td><code>mcpfactory_campaign_stats</code></td>
              <td>Get campaign statistics</td>
            </tr>
          </tbody>
        </table>

        <h2>Natural Language Usage</h2>
        <p>
          You don&apos;t need to call tools directly. Just describe what you want:
        </p>
        <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto">
          <code className="text-gray-800">{`"Launch a cold email campaign for acme.com 
targeting CTOs at tech startups. 
Budget: $10/day max. 
Run for 5 days as a trial."`}</code>
        </pre>
        <p>The AI assistant will translate this to the appropriate tool calls.</p>

        <h2>Authentication</h2>
        <p>
          All MCP requests require your API key. Include it as a Bearer token:
        </p>
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          <code>Authorization: Bearer YOUR_API_KEY</code>
        </pre>
        <p>
          Get your API key at{" "}
          <a href="https://dashboard.mcpfactory.org/settings/api">
            dashboard.mcpfactory.org/settings/api
          </a>
        </p>

        <h2>Error Handling</h2>
        <table>
          <thead>
            <tr>
              <th>Code</th>
              <th>Meaning</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>unauthorized</code></td>
              <td>Invalid or missing API key</td>
            </tr>
            <tr>
              <td><code>byok_missing</code></td>
              <td>Required BYOK key not configured</td>
            </tr>
            <tr>
              <td><code>byok_invalid</code></td>
              <td>BYOK key is invalid or expired</td>
            </tr>
            <tr>
              <td><code>budget_exceeded</code></td>
              <td>Spending limit reached</td>
            </tr>
            <tr>
              <td><code>rate_limited</code></td>
              <td>Too many requests</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
