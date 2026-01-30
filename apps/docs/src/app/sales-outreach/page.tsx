export default function SalesOutreachDocs() {
  return (
    <div className="max-w-3xl mx-auto px-8 py-12">
      <div className="flex items-center gap-3 mb-4">
        <span className="w-3 h-3 rounded-full bg-primary-500" />
        <span className="text-sm text-primary-600 font-medium">Available</span>
      </div>
      
      <h1 className="text-4xl font-bold mb-4">Sales Outreach MCP</h1>
      <p className="text-xl text-gray-600 mb-8">
        Cold email campaigns from your URL. Find leads, generate emails, send & optimize.
      </p>

      <div className="prose prose-lg">
        <h2>Installation</h2>
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          <code>npx @mcpfactory/sales-outreach</code>
        </pre>

        <p>Or add to your MCP config:</p>
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          <code>{`{
  "mcpServers": {
    "sales-outreach": {
      "command": "npx",
      "args": ["@mcpfactory/sales-outreach"],
      "env": {
        "MCPFACTORY_API_KEY": "your-api-key"
      }
    }
  }
}`}</code>
        </pre>

        <h2>BYOK Keys Required</h2>
        <p>Configure these in your MCP Factory dashboard:</p>
        <table>
          <thead>
            <tr>
              <th>Key</th>
              <th>Purpose</th>
              <th>Get it from</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>OpenAI or Anthropic</td>
              <td>Email generation</td>
              <td>openai.com / anthropic.com</td>
            </tr>
            <tr>
              <td>Apollo</td>
              <td>Lead finding & enrichment</td>
              <td>apollo.io</td>
            </tr>
            <tr>
              <td>Resend</td>
              <td>Email sending</td>
              <td>resend.com</td>
            </tr>
          </tbody>
        </table>

        <h2>Usage</h2>
        <p>In Claude, Cursor, or any MCP-compatible client:</p>
        <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto">
          <code className="text-gray-800">
            "Launch a cold email campaign for acme.com targeting CTOs at tech startups,
            $10/day budget, 5 days trial, daily report to ceo@acme.com"
          </code>
        </pre>

        <h2>Available Tools</h2>

        <h3>launch_campaign</h3>
        <p>Start a new outreach campaign.</p>
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          <code>{`{
  "target_url": "acme.com",
  "target_audience": "CTOs at tech startups, 10-200 employees",
  "budget": {
    "max_daily_usd": 10
  },
  "schedule": {
    "frequency": "daily",
    "trial_days": 5
  },
  "reporting": {
    "frequency": "daily",
    "email": "ceo@acme.com"
  }
}`}</code>
        </pre>

        <h3>get_campaign_results</h3>
        <p>Get results for a campaign.</p>
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          <code>{`{
  "campaign_id": "camp_abc123"
}`}</code>
        </pre>
        <p>Returns:</p>
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          <code>{`{
  "status": "running",
  "stats": {
    "emails_sent": 247,
    "delivered": 231,
    "opened": 54,
    "replied": 12,
    "meetings_booked": 3
  },
  "costs": {
    "total_byok_usd": 4.23,
    "budget_remaining_usd": 5.77
  },
  "dashboard_url": "https://app.mcpfactory.org/campaigns/camp_abc123"
}`}</code>
        </pre>

        <h3>pause_campaign / resume_campaign</h3>
        <p>Control campaign execution.</p>

        <h3>get_stats</h3>
        <p>Get your usage and community benchmarks.</p>
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          <code>{`{
  "your_usage": {
    "emails_this_month": 247,
    "estimated_byok_cost": "$4.23"
  },
  "community_benchmarks": {
    "delivery_rate": "94.2%",
    "open_rate": "23.1%",
    "reply_rate": "4.8%",
    "avg_cost_per_email": "$0.017"
  }
}`}</code>
        </pre>

        <h2>Pricing</h2>
        <table>
          <thead>
            <tr>
              <th>Plan</th>
              <th>Price</th>
              <th>Quota</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Free</td>
              <td>$0 + BYOK costs</td>
              <td>1,000 emails</td>
            </tr>
            <tr>
              <td>Pro</td>
              <td>$20/mo + BYOK costs</td>
              <td>10,000 emails</td>
            </tr>
          </tbody>
        </table>

        <p>
          <strong>Estimated BYOK cost:</strong> ~$0.02/email (OpenAI + Apollo + Resend)
        </p>
      </div>
    </div>
  );
}
