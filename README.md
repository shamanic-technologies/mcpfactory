# MCP Factory

**The DFY, BYOK MCP Platform**

> You give us your URL. We give you customers.

## What is MCP Factory?

MCP Factory provides Done-For-You (DFY) automation tools via the Model Context Protocol (MCP). 

**DFY means:** You provide a URL + budget. We handle everything else - lead finding, content generation, outreach, optimization, and reporting.

**BYOK means:** Bring Your Own Keys. You use your own API keys (OpenAI, Anthropic, Apollo, etc.), so you only pay for what you use. No hidden markups.

## Pricing

| Plan | Price | Included |
|------|-------|----------|
| **Free** | $0 | Generous quota per MCP (500-1000 actions) + BYOK costs |
| **Pro** | $20/mo | 10x quota, priority support, advanced analytics |

## Available MCPs

### URL to Revenue (Outreach)

| MCP | What it does | Free Quota |
|-----|--------------|------------|
| `@mcpfactory/influencer-pitch` | Find & pitch relevant influencers | 500 pitches |
| `@mcpfactory/thought-leader` | Pitch journalists for thought leadership | 500 pitches |
| `@mcpfactory/sales-outreach` | Cold email campaigns to prospects | 1000 emails |
| `@mcpfactory/podcaster-pitch` | Find & pitch podcast hosts | 500 pitches |
| `@mcpfactory/journalist-pitch` | Pitch journalists for announcements | 500 pitches |

### URL to Ads (Campaigns)

| MCP | What it does | Free Quota |
|-----|--------------|------------|
| `@mcpfactory/google-ads` | Create & optimize Google Ads campaigns | 100 campaigns |
| `@mcpfactory/reddit-ads` | Create & optimize Reddit Ads campaigns | 100 campaigns |

## Quick Start

```bash
# Install any MCP
npx @mcpfactory/sales-outreach

# Or add to your MCP config
{
  "mcpServers": {
    "sales-outreach": {
      "command": "npx",
      "args": ["@mcpfactory/sales-outreach"],
      "env": {
        "MCPFACTORY_API_KEY": "your-api-key"
      }
    }
  }
}
```

## Usage Example

In Claude, Cursor, or any MCP-compatible client:

> "Launch a cold email campaign for acme.com, $10/day budget, 5 days trial, daily report to ceo@acme.com"

That's it. We handle:
1. Scraping & analyzing your URL
2. Identifying ideal customer profile
3. Finding relevant leads
4. Generating personalized emails
5. Sending with proper deliverability
6. A/B testing & optimization
7. Daily reports with dashboard link

## Common Features (All MCPs)

### Budget Control
```
"budget": {
  "max_daily_usd": 10,
  "max_weekly_usd": 50,
  "max_monthly_usd": 150
}
```

### Scheduling
```
"schedule": {
  "frequency": "daily",
  "trial_days": 5,
  "pause_on_weekend": true
}
```

### Reporting
```
"reporting": {
  "frequency": "daily",
  "channels": ["email", "whatsapp"],
  "email": "you@company.com"
}
```

### Results via MCP
```
Tool: get_campaign_results
→ Returns stats, costs, dashboard URL, next run time
```

## Transparency

Each MCP includes a `get_stats` tool showing:
- Your usage & estimated BYOK costs
- Community benchmarks (delivery rates, open rates, reply rates)
- Average cost per action

## Open Source

This project is 100% open source. MIT License.

## Monorepo Structure

```
mcpfactory/
├── apps/
│   ├── dashboard/     # app.mcpfactory.org
│   └── landing/       # mcpfactory.org
├── packages/
│   ├── mcp-influencer-pitch/
│   ├── mcp-thought-leader/
│   ├── mcp-sales-outreach/
│   ├── mcp-podcaster-pitch/
│   ├── mcp-journalist-pitch/
│   ├── mcp-google-ads/
│   └── mcp-reddit-ads/
└── shared/
    ├── types/
    ├── auth/
    └── byok/
```

## Contributing

Contributions welcome! See [CONTRIBUTING.md](./CONTRIBUTING.md).

## License

MIT
