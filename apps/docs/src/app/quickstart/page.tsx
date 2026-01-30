export default function QuickstartPage() {
  return (
    <div className="max-w-3xl mx-auto px-8 py-12">
      <h1 className="text-4xl font-bold mb-4">Quick Start</h1>
      <p className="text-xl text-gray-600 mb-8">
        Get up and running with MCP Factory in 5 minutes.
      </p>

      <div className="prose prose-lg">
        <h2>1. Create an Account</h2>
        <p>
          Go to <a href="https://app.mcpfactory.org/sign-up">app.mcpfactory.org/sign-up</a> and
          create your account.
        </p>

        <h2>2. Get Your API Key</h2>
        <p>
          In the dashboard, go to <strong>API Key</strong> and copy your MCP Factory API key.
          This key identifies you across all MCPs.
        </p>

        <h2>3. Configure BYOK Keys</h2>
        <p>
          Go to <strong>Sales Outreach</strong> in the sidebar and add your BYOK keys:
        </p>
        <ul>
          <li><strong>OpenAI</strong> - For AI-powered email generation</li>
          <li><strong>Apollo</strong> - For lead finding and enrichment</li>
          <li><strong>Resend</strong> - For email sending</li>
        </ul>

        <h2>4. Install the MCP</h2>
        <p>Add to your Claude Desktop or Cursor config:</p>
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          <code>{`{
  "mcpServers": {
    "sales-outreach": {
      "command": "npx",
      "args": ["@mcpfactory/sales-outreach"],
      "env": {
        "MCPFACTORY_API_KEY": "mcpf_your_key_here"
      }
    }
  }
}`}</code>
        </pre>

        <h2>5. Launch Your First Campaign</h2>
        <p>In Claude or Cursor, just say:</p>
        <blockquote>
          "Launch a cold email campaign for mybrand.com, $10/day budget, 5 days trial"
        </blockquote>

        <p>That's it! The MCP will:</p>
        <ol>
          <li>Analyze your website</li>
          <li>Identify your ideal customer profile</li>
          <li>Find relevant leads via Apollo</li>
          <li>Generate personalized emails</li>
          <li>Send with proper deliverability</li>
          <li>Report results to you</li>
        </ol>

        <h2>What's Next?</h2>
        <ul>
          <li>
            <a href="/sales-outreach">Sales Outreach Documentation</a> - Full API reference
          </li>
          <li>
            <a href="/api">API Reference</a> - Direct API access
          </li>
        </ul>
      </div>
    </div>
  );
}
