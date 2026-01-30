import { Metadata } from "next";

export const metadata: Metadata = {
  title: "API Reference",
  description: "Complete REST API reference for MCP Factory. Endpoints for campaigns, results, usage, and BYOK key management.",
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
        Direct API access to MCP Factory services.
      </p>

      <div className="prose prose-lg">
        <h2>Base URL</h2>
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg">
          <code>https://api.mcpfactory.org</code>
        </pre>

        <h2>Authentication</h2>
        <p>All requests require your MCP Factory API key in the header:</p>
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          <code>{`curl https://api.mcpfactory.org/campaigns \\
  -H "Authorization: Bearer mcpf_your_api_key"`}</code>
        </pre>

        <h2>Endpoints</h2>

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
              <td><code>POST</code></td>
              <td>/campaigns/:id/pause</td>
              <td>Pause a campaign</td>
            </tr>
            <tr>
              <td><code>POST</code></td>
              <td>/campaigns/:id/resume</td>
              <td>Resume a campaign</td>
            </tr>
          </tbody>
        </table>

        <h3>Usage & Stats</h3>
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
              <td>/usage</td>
              <td>Get your usage stats</td>
            </tr>
            <tr>
              <td><code>GET</code></td>
              <td>/benchmarks</td>
              <td>Get community benchmarks</td>
            </tr>
          </tbody>
        </table>

        <h3>BYOK Keys</h3>
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
              <td>/keys</td>
              <td>List configured BYOK keys</td>
            </tr>
            <tr>
              <td><code>PUT</code></td>
              <td>/keys/:provider</td>
              <td>Update a BYOK key</td>
            </tr>
            <tr>
              <td><code>DELETE</code></td>
              <td>/keys/:provider</td>
              <td>Remove a BYOK key</td>
            </tr>
          </tbody>
        </table>

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
        <p>All errors return a JSON response with an error message:</p>
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          <code>{`{
  "error": {
    "code": "unauthorized",
    "message": "Invalid API key"
  }
}`}</code>
        </pre>
      </div>
    </div>
  );
}
