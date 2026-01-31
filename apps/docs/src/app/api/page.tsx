import { Metadata } from "next";

export const metadata: Metadata = {
  title: "API Reference",
  description: "Complete REST API reference for MCP Factory. Endpoints for campaigns, leads, company scraping, and more.",
  openGraph: {
    title: "API Reference | MCP Factory Docs",
    description: "REST API documentation for MCP Factory.",
  },
};

export default function ApiOverviewPage() {
  return (
    <div className="max-w-3xl mx-auto px-8 py-12">
      <h1 className="text-4xl font-bold mb-4">API Reference</h1>
      <p className="text-xl text-gray-600 mb-8">
        Direct REST API access to MCP Factory services.
      </p>

      <div className="prose prose-lg">
        <h2>Base URL</h2>
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg">
          <code>https://api.mcpfactory.org/v1</code>
        </pre>

        <h2>Authentication</h2>
        <p>All requests require your API key in the header:</p>
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          <code>{`curl https://api.mcpfactory.org/v1/campaigns \\
  -H "X-API-Key: YOUR_API_KEY"`}</code>
        </pre>
        <p>
          Get your API key at{" "}
          <a href="https://dashboard.mcpfactory.org/settings/api">
            dashboard.mcpfactory.org/settings/api
          </a>
        </p>

        <h2>Endpoints</h2>

        <h3>Account</h3>
        <table>
          <thead>
            <tr>
              <th>Method</th>
              <th>Endpoint</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>GET</code></td>
              <td>/me</td>
              <td>Get current user and organization info</td>
            </tr>
          </tbody>
        </table>

        <h3>Company Scraping</h3>
        <table>
          <thead>
            <tr>
              <th>Method</th>
              <th>Endpoint</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>POST</code></td>
              <td>/company/scrape</td>
              <td>Scrape company info from URL</td>
            </tr>
            <tr>
              <td><code>GET</code></td>
              <td>/company/:id</td>
              <td>Get scraped company by ID</td>
            </tr>
          </tbody>
        </table>

        <h4>Scrape Company</h4>
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          <code>{`POST /v1/company/scrape
Content-Type: application/json

{
  "url": "https://acme.com"
}`}</code>
        </pre>

        <h3>Lead Search</h3>
        <table>
          <thead>
            <tr>
              <th>Method</th>
              <th>Endpoint</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>POST</code></td>
              <td>/leads/search</td>
              <td>Search leads via Apollo</td>
            </tr>
            <tr>
              <td><code>POST</code></td>
              <td>/leads/enrich</td>
              <td>Enrich a lead with additional info</td>
            </tr>
          </tbody>
        </table>

        <h4>Search Leads</h4>
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          <code>{`POST /v1/leads/search
Content-Type: application/json

{
  "person_titles": ["CEO", "CTO", "Founder"],
  "organization_locations": ["United States"],
  "organization_industries": ["Software"],
  "per_page": 10
}`}</code>
        </pre>

        <h3>Reply Qualification</h3>
        <table>
          <thead>
            <tr>
              <th>Method</th>
              <th>Endpoint</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>POST</code></td>
              <td>/qualify</td>
              <td>Qualify an email reply with AI</td>
            </tr>
          </tbody>
        </table>

        <h4>Qualify Reply</h4>
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          <code>{`POST /v1/qualify
Content-Type: application/json

{
  "fromEmail": "prospect@company.com",
  "toEmail": "sales@yourbrand.com",
  "subject": "Re: Quick question",
  "bodyText": "Thanks for reaching out! I'd love to learn more..."
}`}</code>
        </pre>

        <h3>Campaigns</h3>
        <table>
          <thead>
            <tr>
              <th>Method</th>
              <th>Endpoint</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>POST</code></td>
              <td>/campaigns</td>
              <td>Create a new campaign</td>
            </tr>
            <tr>
              <td><code>GET</code></td>
              <td>/campaigns</td>
              <td>List all campaigns</td>
            </tr>
            <tr>
              <td><code>GET</code></td>
              <td>/campaigns/:id</td>
              <td>Get campaign details</td>
            </tr>
            <tr>
              <td><code>GET</code></td>
              <td>/campaigns/:id/stats</td>
              <td>Get campaign statistics</td>
            </tr>
            <tr>
              <td><code>POST</code></td>
              <td>/campaigns/:id/start</td>
              <td>Start a campaign</td>
            </tr>
            <tr>
              <td><code>POST</code></td>
              <td>/campaigns/:id/pause</td>
              <td>Pause a campaign</td>
            </tr>
          </tbody>
        </table>

        <h4>Create Campaign</h4>
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          <code>{`POST /v1/campaigns
Content-Type: application/json

{
  "name": "Q1 Outreach",
  "clientUrl": "https://yourbrand.com",
  "targetTitles": ["CEO", "CTO"],
  "targetIndustries": ["Software", "SaaS"],
  "targetLocations": ["United States"],
  "maxDailyBudgetUsd": 10,
  "startDate": "2026-02-01"
}`}</code>
        </pre>

        <h2>Rate Limits</h2>
        <table>
          <thead>
            <tr>
              <th>Plan</th>
              <th>Rate Limit</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Free</td>
              <td>100 requests/minute</td>
            </tr>
            <tr>
              <td>Pro</td>
              <td>1,000 requests/minute</td>
            </tr>
          </tbody>
        </table>

        <h2>Errors</h2>
        <p>All errors return a JSON response:</p>
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          <code>{`{
  "error": "Invalid API key"
}`}</code>
        </pre>

        <h3>HTTP Status Codes</h3>
        <table>
          <thead>
            <tr>
              <th>Code</th>
              <th>Meaning</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>200</code></td>
              <td>Success</td>
            </tr>
            <tr>
              <td><code>400</code></td>
              <td>Bad request (invalid parameters)</td>
            </tr>
            <tr>
              <td><code>401</code></td>
              <td>Unauthorized (invalid API key)</td>
            </tr>
            <tr>
              <td><code>404</code></td>
              <td>Resource not found</td>
            </tr>
            <tr>
              <td><code>429</code></td>
              <td>Rate limit exceeded</td>
            </tr>
            <tr>
              <td><code>500</code></td>
              <td>Internal server error</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
