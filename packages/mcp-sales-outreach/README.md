# @mcpfactory/sales-outreach

**From URL to Revenue** - DFY Cold Email Outreach

> You provide a URL + budget. We handle lead finding, email generation, sending, optimization, and reporting.

## What This MCP Does

1. **Scrapes your URL** - Understands your product/service
2. **Identifies ICP** - Determines ideal customer profile
3. **Finds leads** - Via Apollo/Clearbit (your BYOK)
4. **Researches each lead** - LinkedIn posts, company news
5. **Generates personalized emails** - References their specific context
6. **Sends with deliverability** - Rotation, warmup, timing
7. **A/B tests automatically** - Subjects, hooks, CTAs
8. **Optimizes continuously** - Scales winners, pauses losers
9. **Reports results** - Email/WhatsApp with dashboard link

## Pricing

| Plan | Price | Quota |
|------|-------|-------|
| Free | $0 + BYOK costs | 1,000 emails |
| Pro | $20/mo + BYOK costs | 10,000 emails |

**Estimated BYOK cost:** ~$0.02/email (OpenAI + Apollo + Resend)

## Installation

```bash
npx @mcpfactory/sales-outreach
```

Or add to your MCP config:

```json
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

## Usage

In Claude, Cursor, or any MCP client:

> "Launch a cold email campaign for acme.com targeting CTOs at tech startups, $10/day budget, 5 days trial, daily report to ceo@acme.com"

### Available Tools

#### `launch_campaign`

Start a new outreach campaign.

```json
{
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
}
```

#### `get_campaign_results`

Get results for a campaign.

```json
{
  "campaign_id": "camp_abc123"
}
```

Returns:
```json
{
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
  "dashboard_url": "https://dashboard.mcpfactory.org/campaigns/camp_abc123"
}
```

#### `pause_campaign` / `resume_campaign`

Control campaign execution.

#### `get_stats`

Get your usage and community benchmarks.

```json
{
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
}
```

## BYOK Keys Required

Configure these in your MCP Factory dashboard:

| Key | Purpose | Where to get |
|-----|---------|--------------|
| OpenAI or Anthropic | Email generation | openai.com / anthropic.com |
| Apollo | Lead finding | apollo.io |
| Resend | Email sending | resend.com |

## Open Source

MIT License - See [GitHub](https://github.com/mcpfactory/mcpfactory)

---

Part of [MCP Factory](https://mcpfactory.org) - The DFY, BYOK MCP Platform
