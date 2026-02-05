# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MCP Factory is a DFY (Done-For-You), BYOK (Bring Your Own Keys) automation platform built on the Model Context Protocol. Users provide a URL + budget, the platform handles lead finding, outreach, email generation, and reporting. Users bring their own API keys (OpenAI, Anthropic, Apollo, etc.).

## Commands

### Development
```bash
pnpm dev                    # All services via Turbo
pnpm dev:dashboard          # Dashboard only (Next.js, port 3001)
pnpm dev:<service-name>     # Any individual service
```

### Build & Lint
```bash
pnpm build                  # Build all (Turbo-orchestrated)
pnpm lint                   # Lint all packages
```

### Testing
```bash
pnpm --filter @mcpfactory/<package> test          # All tests for a service
pnpm --filter @mcpfactory/<package> test:unit      # Unit tests only
pnpm --filter @mcpfactory/<package> vitest run tests/unit/specific.test.ts  # Single test file
```

## Architecture

**Monorepo** using pnpm workspaces + Turborepo. Three workspace roots: `apps/`, `packages/`, `shared/`.

### Apps

- **dashboard** (port 3001) — Next.js 15 App Router. Clerk auth with `(dashboard)` route group for protected pages.
- **docs** — Documentation site (docs.mcpfactory.org)
- **mcp-service** — MCP server endpoint service
- **performance-service** — Performance monitoring service
- **sales-cold-emails-landing** — Marketing landing page (salescoldemail.mcpfactory.org)

### Packages (Published MCP Servers)

Each package under `packages/` is a standalone MCP server published to npm. Built with `tsup` for ESM. Uses `@modelcontextprotocol/sdk`.

- `mcp-sales-outreach` — @mcpfactory/sales-outreach
- `mcp-google-ads` — @mcpfactory/google-ads
- `mcp-influencer-pitch` — @mcpfactory/influencer-pitch
- `mcp-journalist-pitch` — @mcpfactory/journalist-pitch
- `mcp-podcaster-pitch` — @mcpfactory/podcaster-pitch
- `mcp-reddit-ads` — @mcpfactory/reddit-ads
- `mcp-thought-leader` — @mcpfactory/thought-leader

### Shared Libraries

- `shared/content/` — **Single source of truth for all marketing/docs content** (see Content Sync Rules below)
- `shared/pictures/` — Shared images and assets

## Tech Stack

- **Runtime:** Node.js >=20, TypeScript 5.3 (strict, ES2022, NodeNext modules)
- **Package manager:** pnpm 9.15.0
- **Frontend:** Next.js 15, React 18, Tailwind CSS, Clerk
- **MCP:** @modelcontextprotocol/sdk, tsup builds
- **Testing:** Vitest
- **CI:** GitHub Actions (build → parallel test jobs, lint with continue-on-error)
- **Deploy:** Railway

## Content Sync Rules

All marketing/docs content lives in `shared/content/src/`. The public surfaces import from `@mcpfactory/content` instead of hardcoding values.

### SSoT module files
- `shared/content/src/urls.ts` — All public URLs (dashboard, docs, API, GitHub, MCP endpoint)
- `shared/content/src/mcps.ts` — MCP package definitions (name, description, quota, availability)
- `shared/content/src/pricing.ts` — Pricing tiers, BYOK cost estimates, rate limits
- `shared/content/src/features.ts` — Feature descriptions, FAQ, steps, supported AI clients, BYOK providers
- `shared/content/src/brand.ts` — Brand name, tagline, hero text

### Public surfaces (import from @mcpfactory/content)
1. `apps/docs/` — docs.mcpfactory.org
2. `apps/sales-cold-emails-landing/` — salescoldemail.mcpfactory.org
3. `README.md` — **GENERATED** (do not edit directly)

### When you change content

If you modify MCP packages, pricing, URLs, features, BYOK providers, or API endpoints:

1. Update the data in `shared/content/src/`
2. Run `pnpm generate:readme` to regenerate README.md
3. Verify apps build: `pnpm build`
4. Commit the regenerated README.md alongside your changes

### Content rules
- **NEVER** hardcode pricing, MCP names, quotas, or URLs in page components
- **ALWAYS** import from `@mcpfactory/content`
- **README.md is GENERATED** — edit `shared/content/` then run `pnpm generate:readme`
