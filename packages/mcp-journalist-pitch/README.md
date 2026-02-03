# @mcpfactory/journalist-pitch

**DFY Press Release Distribution** - Pitch journalists about your announcements

> You provide a URL + announcement. We find relevant journalists, craft pitches, and get you coverage.

## What This MCP Does

1. **Understands your announcement** - From URL and description
2. **Identifies news angle** - What makes it newsworthy
3. **Finds relevant journalists** - Who cover your industry
4. **Crafts personalized pitches** - Tailored to each journalist's beat
5. **Sends outreach** - With proper follow-ups
6. **Tracks coverage** - Reports articles and mentions

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
      "args": ["@mcpfactory/journalist-pitch"],
      "env": {
        "MCPFACTORY_API_KEY": "YOUR_API_KEY"
      }
    }
  }
}
```

## Usage

> "Pitch journalists about our Series A funding announcement, based on mybrand.com"

## Available Tools

- `launch_campaign` - Start press outreach
- `get_campaign_results` - Get coverage stats
- `pause_campaign` / `resume_campaign` - Control execution
- `get_stats` - Usage and community benchmarks

---

Part of [MCP Factory](https://mcpfactory.org) - The DFY, BYOK MCP Platform
