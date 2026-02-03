# @mcpfactory/podcaster-pitch

**DFY Podcast Outreach** - Get booked as a guest on relevant podcasts

> You provide a URL + topic. We find podcasts, research hosts, craft pitches, and handle booking.

## What This MCP Does

1. **Analyzes your expertise** - From URL and background
2. **Finds relevant podcasts** - In your niche, accepting guests
3. **Researches each show** - Past episodes, host style, audience
4. **Generates guest pitches** - Topics you could discuss
5. **Sends personalized outreach** - To podcast hosts/bookers
6. **Tracks responses** - Reports bookings and interviews

## Pricing

| Plan | Price | Quota |
|------|-------|-------|
| Free | $0 + BYOK costs | 500 pitches |
| Pro | $20/mo + BYOK costs | 5,000 pitches |

**Estimated BYOK cost:** ~$0.05/pitch

## Installation

Add to your MCP client config (Cursor, Claude Code, etc.):

```json
{
  "mcpServers": {
    "mcpfactory": {
      "url": "https://mcp.mcpfactory.org/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_API_KEY"
      }
    }
  }
}
```

**Alternative (local npx):**

```json
{
  "mcpServers": {
    "mcpfactory": {
      "command": "npx",
      "args": ["@mcpfactory/podcaster-pitch"],
      "env": {
        "MCPFACTORY_API_KEY": "YOUR_API_KEY"
      }
    }
  }
}
```

## Usage

> "Find tech podcasts that interview SaaS founders and pitch me as a guest, based on mybrand.com"

## Available Tools

- `launch_campaign` - Start podcast outreach
- `get_campaign_results` - Get booking stats
- `pause_campaign` / `resume_campaign` - Control execution
- `get_stats` - Usage and community benchmarks

---

Part of [MCP Factory](https://mcpfactory.org) - The DFY, BYOK MCP Platform
