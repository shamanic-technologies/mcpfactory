# @mcpfactory/google-ads

**DFY Google Ads** - Create and optimize campaigns automatically

> You provide a URL + budget. We create campaigns, write ads, find keywords, and optimize for conversions.

## What This MCP Does

1. **Analyzes your business** - From URL
2. **Researches keywords** - Competitor terms, pain points, solutions
3. **Generates ad copy** - Headlines, descriptions, CTAs
4. **Creates campaign structure** - Ad groups by intent
5. **Sets up via Google Ads API** - Using your BYOK credentials
6. **Monitors performance** - Clicks, conversions, costs
7. **Optimizes continuously** - Pause losers, scale winners
8. **Reports results** - Daily performance summary

## Pricing

| Plan | Price | Quota |
|------|-------|-------|
| Free | $0 + BYOK costs | 100 campaigns |
| Pro | $20/mo + BYOK costs | 1,000 campaigns |

**Estimated BYOK cost:** ~$0.10/campaign setup (AI costs only, ad spend separate)

## Usage

> "Create a Google Ads campaign for mybrand.com targeting B2B SaaS buyers, $50/day ad budget"

## Available Tools

- `create_campaign` - Create a new campaign
- `get_campaign_performance` - Get stats
- `optimize_campaign` - Run optimization pass
- `pause_campaign` / `resume_campaign` - Control execution
- `get_stats` - Usage and benchmarks

---

Part of [MCP Factory](https://mcpfactory.org) - The DFY, BYOK MCP Platform
