export default function DocsHome() {
  return (
    <div className="max-w-3xl mx-auto px-8 py-12">
      <h1 className="text-4xl font-bold mb-4">MCP Factory Documentation</h1>
      <p className="text-xl text-gray-600 mb-8">
        The DFY, BYOK MCP Platform. From URL to Revenue.
      </p>

      <div className="prose prose-lg">
        <h2>What is MCP Factory?</h2>
        <p>
          MCP Factory provides Done-For-You (DFY) automation tools via the Model Context Protocol (MCP).
          You provide a URL + budget, we handle everything else.
        </p>

        <h2>Getting Started</h2>
        <ol>
          <li>
            <a href="https://app.mcpfactory.org/sign-up">Create an account</a> and get your API key
          </li>
          <li>Configure your BYOK keys (OpenAI, Apollo, Resend, etc.)</li>
          <li>Install the MCP you want to use</li>
          <li>Start automating from Claude, Cursor, or any MCP-compatible client</li>
        </ol>

        <h2>Available MCPs</h2>
        <ul>
          <li>
            <a href="/sales-outreach">
              <strong>Sales Outreach</strong>
            </a>{" "}
            - Cold email campaigns from your URL
          </li>
          <li>
            <strong>Influencer Pitch</strong> (Coming Soon) - Find and pitch influencers
          </li>
          <li>
            <strong>Thought Leader</strong> (Coming Soon) - Get featured as an expert
          </li>
          <li>
            <strong>Podcaster Pitch</strong> (Coming Soon) - Get booked on podcasts
          </li>
          <li>
            <strong>Journalist Pitch</strong> (Coming Soon) - Pitch your announcements
          </li>
          <li>
            <strong>Google Ads</strong> (Coming Soon) - Create Google Ads campaigns
          </li>
          <li>
            <strong>Reddit Ads</strong> (Coming Soon) - Create Reddit Ads campaigns
          </li>
        </ul>

        <h2>Key Concepts</h2>
        <h3>DFY (Done For You)</h3>
        <p>
          Unlike traditional tools that require you to set up everything, MCP Factory does the work for you.
          You just provide your URL and budget - we handle lead finding, content generation, outreach,
          optimization, and reporting.
        </p>

        <h3>BYOK (Bring Your Own Keys)</h3>
        <p>
          You use your own API keys for the underlying services (OpenAI, Apollo, Resend, etc.).
          This means you pay only for actual usage with no hidden markups.
        </p>
      </div>
    </div>
  );
}
