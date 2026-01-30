import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Campaigns API",
  description: "Create, list, pause, and resume campaigns via the MCP Factory REST API. Full endpoint reference with examples.",
  openGraph: {
    title: "Campaigns API | MCP Factory Docs",
    description: "Campaign management endpoints for MCP Factory.",
  },
};

export default function CampaignsApiPage() {
  return (
    <div className="max-w-3xl mx-auto px-8 py-12">
      <h1 className="text-4xl font-bold mb-4">Campaigns API</h1>
      <p className="text-xl text-gray-600 mb-8">
        Create, manage, and monitor campaigns via the REST API.
      </p>

      <div className="prose prose-lg">
        <h2>Create Campaign</h2>
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          <code>{`POST /campaigns
Content-Type: application/json
Authorization: Bearer mcpf_live_xxxx

{
  "mcp": "sales-outreach",
  "target_url": "acme.com",
  "target_audience": "CTOs at SaaS companies, 50-200 employees",
  "budget": {
    "max_daily_usd": 10,
    "max_weekly_usd": 50,
    "max_monthly_usd": 200
  },
  "schedule": {
    "frequency": "daily",
    "trial_days": 5,
    "start_date": "2026-02-01"
  },
  "reporting": {
    "frequency": "daily",
    "email": "founder@acme.com",
    "webhook_url": "https://..."
  }
}`}</code>
        </pre>

        <h3>Response</h3>
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          <code>{`{
  "id": "camp_abc123",
  "status": "starting",
  "mcp": "sales-outreach",
  "target_url": "acme.com",
  "created_at": "2026-01-30T10:00:00Z",
  "dashboard_url": "https://dashboard.mcpfactory.org/campaigns/camp_abc123"
}`}</code>
        </pre>

        <h2>List Campaigns</h2>
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          <code>{`GET /campaigns
GET /campaigns?status=running
GET /campaigns?mcp=sales-outreach`}</code>
        </pre>

        <h3>Response</h3>
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          <code>{`{
  "campaigns": [
    {
      "id": "camp_abc123",
      "status": "running",
      "mcp": "sales-outreach",
      "target_url": "acme.com",
      "created_at": "2026-01-30T10:00:00Z"
    }
  ],
  "pagination": {
    "total": 1,
    "page": 1,
    "per_page": 20
  }
}`}</code>
        </pre>

        <h2>Get Campaign</h2>
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          <code>{`GET /campaigns/:id`}</code>
        </pre>

        <h3>Response</h3>
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          <code>{`{
  "id": "camp_abc123",
  "status": "running",
  "mcp": "sales-outreach",
  "target_url": "acme.com",
  "target_audience": "CTOs at SaaS companies",
  "budget": {
    "max_daily_usd": 10,
    "spent_today_usd": 3.45
  },
  "schedule": {
    "frequency": "daily",
    "trial_days": 5,
    "days_remaining": 3
  },
  "stats": {
    "emails_sent": 127,
    "delivered": 119,
    "opened": 28,
    "replied": 6,
    "meetings_booked": 1
  },
  "created_at": "2026-01-30T10:00:00Z"
}`}</code>
        </pre>

        <h2>Pause Campaign</h2>
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          <code>{`POST /campaigns/:id/pause`}</code>
        </pre>

        <h3>Response</h3>
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          <code>{`{
  "id": "camp_abc123",
  "status": "paused",
  "paused_at": "2026-01-31T15:30:00Z"
}`}</code>
        </pre>

        <h2>Resume Campaign</h2>
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          <code>{`POST /campaigns/:id/resume`}</code>
        </pre>

        <h3>Response</h3>
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          <code>{`{
  "id": "camp_abc123",
  "status": "running",
  "resumed_at": "2026-02-01T09:00:00Z"
}`}</code>
        </pre>

        <h2>Campaign Statuses</h2>
        <table>
          <thead>
            <tr>
              <th>Status</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>starting</code></td>
              <td>Campaign is being set up</td>
            </tr>
            <tr>
              <td><code>running</code></td>
              <td>Campaign is active</td>
            </tr>
            <tr>
              <td><code>paused</code></td>
              <td>Manually paused</td>
            </tr>
            <tr>
              <td><code>budget_paused</code></td>
              <td>Paused due to budget limit</td>
            </tr>
            <tr>
              <td><code>completed</code></td>
              <td>Trial period or schedule ended</td>
            </tr>
            <tr>
              <td><code>failed</code></td>
              <td>Error occurred (check logs)</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
