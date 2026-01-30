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

        <h2>Supported Clients</h2>
        <ul>
          <li>
            <strong>Claude Desktop</strong> - Anthropic&apos;s desktop app
          </li>
          <li>
            <strong>Cursor</strong> - AI-powered IDE
          </li>
          <li>
            <strong>Cline</strong> - VS Code extension
          </li>
          <li>
            <strong>Any MCP-compatible client</strong>
          </li>
        </ul>

        <h2>Installation</h2>

        <h3>Claude Desktop</h3>
        <p>
          Add to your <code>~/Library/Application Support/Claude/claude_desktop_config.json</code>:
        </p>
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          <code>{`{
  "mcpServers": {
    "sales-outreach": {
      "command": "npx",
      "args": ["@mcpfactory/sales-outreach"],
      "env": {
        "MCPFACTORY_API_KEY": "mcpf_live_xxxx"
      }
    }
  }
}`}</code>
        </pre>

        <h3>Cursor</h3>
        <p>
          Add to your <code>.cursor/mcp.json</code> in your project or globally:
        </p>
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          <code>{`{
  "mcpServers": {
    "sales-outreach": {
      "command": "npx",
      "args": ["@mcpfactory/sales-outreach"],
      "env": {
        "MCPFACTORY_API_KEY": "mcpf_live_xxxx"
      }
    }
  }
}`}</code>
        </pre>

        <h3>Cline (VS Code)</h3>
        <p>Open Cline settings and add the MCP server configuration.</p>

        <h2>Common Parameters</h2>
        <p>All MCP Factory tools share these common parameters:</p>

        <h3>Budget Control</h3>
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          <code>{`{
  "budget": {
    "max_daily_usd": 10,      // Daily BYOK spend limit
    "max_weekly_usd": 50,     // Weekly limit
    "max_monthly_usd": 200    // Monthly limit
  }
}`}</code>
        </pre>

        <h3>Schedule</h3>
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          <code>{`{
  "schedule": {
    "frequency": "daily",     // "daily" | "weekly" | "once"
    "trial_days": 5,          // Run for N days then pause
    "start_date": "2026-02-01",
    "end_date": "2026-02-28"
  }
}`}</code>
        </pre>

        <h3>Reporting</h3>
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          <code>{`{
  "reporting": {
    "frequency": "daily",     // "daily" | "weekly" | "realtime"
    "email": "you@company.com",
    "whatsapp": "+1234567890",
    "webhook_url": "https://..."
  }
}`}</code>
        </pre>

        <h2>Natural Language Usage</h2>
        <p>
          You don&apos;t need to write JSON. Just describe what you want in plain
          language:
        </p>
        <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto">
          <code className="text-gray-800">{`"Launch a cold email campaign for acme.com 
targeting CTOs at tech startups. 
Budget: $10/day max. 
Run for 5 days as a trial. 
Send me a daily report at ceo@acme.com."`}</code>
        </pre>
        <p>The AI assistant will translate this to the appropriate tool call.</p>

        <h2>Error Handling</h2>
        <p>MCP Factory returns structured errors:</p>
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          <code>{`{
  "error": {
    "code": "budget_exceeded",
    "message": "Daily budget of $10 has been reached",
    "details": {
      "spent_today": 10.23,
      "limit": 10.00
    }
  }
}`}</code>
        </pre>

        <h3>Common Error Codes</h3>
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
              <td><code>quota_exceeded</code></td>
              <td>Free tier limit reached</td>
            </tr>
            <tr>
              <td><code>rate_limited</code></td>
              <td>Too many requests</td>
            </tr>
          </tbody>
        </table>

        <h2>Best Practices</h2>
        <ol>
          <li>
            <strong>Start with a trial</strong> - Use <code>trial_days: 5</code>{" "}
            to test before committing
          </li>
          <li>
            <strong>Set budget limits</strong> - Always configure max spend to
            avoid surprises
          </li>
          <li>
            <strong>Enable reporting</strong> - Get daily updates on campaign
            performance
          </li>
          <li>
            <strong>Check benchmarks</strong> - Use <code>get_stats</code> to
            compare against community averages
          </li>
        </ol>
      </div>
    </div>
  );
}
