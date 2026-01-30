# @mcpfactory/reddit-ads

**DFY Reddit Ads** - Create and optimize campaigns automatically

> You provide a URL + budget. We find relevant subreddits, create campaigns, write ads, and optimize.

## What This MCP Does

1. **Analyzes your business** - From URL
2. **Finds relevant subreddits** - Where your audience hangs out
3. **Generates ad copy** - Native to Reddit's style
4. **Creates campaign structure** - Targeting by subreddit/interest
5. **Sets up via Reddit Ads API** - Using your BYOK credentials
6. **Monitors performance** - Impressions, clicks, conversions
7. **Optimizes continuously** - Test creatives, refine targeting
8. **Reports results** - Daily performance summary

## Pricing

| Plan | Price | Quota |
|------|-------|-------|
| Free | $0 + BYOK costs | 100 campaigns |
| Pro | $20/mo + BYOK costs | 1,000 campaigns |

**Estimated BYOK cost:** ~$0.10/campaign setup (AI costs only, ad spend separate)

## Usage

> "Create a Reddit Ads campaign for mybrand.com targeting developers in r/programming, $25/day ad budget"

## Available Tools

- `create_campaign` - Create a new campaign
- `get_campaign_performance` - Get stats
- `optimize_campaign` - Run optimization pass
- `pause_campaign` / `resume_campaign` - Control execution
- `get_stats` - Usage and benchmarks

---

Part of [MCP Factory](https://mcpfactory.org) - The DFY, BYOK MCP Platform
