# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MCP Factory is a DFY (Done-For-You), BYOK (Bring Your Own Keys) automation platform built on the Model Context Protocol. Users provide a URL + budget, the platform handles lead finding, outreach, email generation, and reporting. Users bring their own API keys (OpenAI, Anthropic, Apollo, etc.).

## Commands

### Development
```bash
pnpm dev                    # All services via Turbo
pnpm dev:dashboard          # Dashboard only (Next.js, port 3001)
pnpm dev:api-service        # API gateway only (Express, port 3000)
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
pnpm --filter @mcpfactory/<package> test:integration # Integration tests only
pnpm --filter @mcpfactory/<package> vitest run tests/unit/specific.test.ts  # Single test file
```

### Database (per service that has a DB)
```bash
pnpm --filter @mcpfactory/<service> db:generate   # Generate migration files
pnpm --filter @mcpfactory/<service> db:migrate    # Run migrations
pnpm --filter @mcpfactory/<service> db:push       # Push schema directly
pnpm --filter @mcpfactory/<service> db:studio     # Open Drizzle Studio GUI
```

## Architecture

**Monorepo** using pnpm workspaces + Turborepo. Three workspace roots: `apps/`, `packages/`, `shared/`.

### Apps (Microservices)

- **api-service** (port 3000) — Express API gateway. All external requests hit here first. Handles dual auth (Clerk JWT from dashboard, X-API-Key from MCP clients), then proxies to internal services.
- **dashboard** (port 3001) — Next.js 15 App Router. Clerk auth with `(dashboard)` route group for protected pages. Routes organized as `/brands/[brandId]/mcp/[slug]/campaigns/[id]/{emails,leads,replies,companies}`.
- **keys-service** (port 3001 internal) — API key + BYOK key management with Drizzle/PostgreSQL.
- **campaign-service** (port 3004) — Campaign CRUD and orchestration.
- **client-service** (port 3002) — Client/org data management.
- **apollo-service** (port 3003) — Apollo.io lead finding integration.
- **emailgeneration-service** (port 3005) — Email content generation.
- **worker** — BullMQ job processor using Redis/ioredis for async tasks.
- **landing**, **docs**, **sales-cold-emails-landing** — Marketing/docs Next.js sites.

### Packages (Published MCP Servers)

Each package under `packages/` is a standalone MCP server published to npm (e.g., `@mcpfactory/sales-outreach`). Built with `tsup` for ESM. Uses `@modelcontextprotocol/sdk`.

### Shared Libraries

- `shared/types/` — Shared TypeScript type definitions
- `shared/auth/` — API key validation utilities
- `shared/byok/` — BYOK key management

## Key Patterns

### Authentication Flow
The api-service gateway supports two auth methods in `apps/api-service/src/middleware/auth.ts`:
1. **Clerk JWT** (Bearer token) — from dashboard, extracts `orgId` from JWT claims
2. **API Key** (X-API-Key header) — from MCP clients, validated against keys-service

All routes require org context via `requireOrg` middleware. Internal service-to-service calls need no auth (Railway private networking).

### Service Communication
- `apps/api-service/src/lib/service-client.ts` — `callService()` for internal (no auth), `callExternalService()` for external APIs (with API key)
- `apps/dashboard/src/lib/api.ts` — Frontend API client, all calls go through `/v1` prefix with Clerk Bearer token

### Database
All DB services use Drizzle ORM with PostgreSQL. Schemas in `src/db/schema.ts`. Types exported via `$inferSelect`/`$inferInsert`. UUIDs for primary keys, timestamps with timezone.

**Auto-migrations:** All 5 DB services (keys, campaign, client, apollo, emailgeneration) run `migrate()` on startup before `app.listen()`. Schema changes are applied automatically on deploy — never run `db:push` manually in prod. To add a schema change: update `schema.ts`, run `db:generate`, commit the migration SQL file, deploy.

**Env vars / DB URLs:** Prod env vars live in Railway (never in local `.env` files). No `.env` files are committed or expected locally. Tests that need a DB should mock it or use a test DB URL via CI secrets.

**PRs:** Always merge to main immediately after creating the PR — never ask for confirmation.

### Frontend
Dashboard uses `"use client"` components with React hooks for state. Data fetching via `fetch` with Clerk `getToken()`. Tailwind CSS for styling.

## Tech Stack

- **Runtime:** Node.js >=20, TypeScript 5.3 (strict, ES2022, NodeNext modules)
- **Package manager:** pnpm 9.15.0
- **Frontend:** Next.js 15, React 18, Tailwind CSS, Clerk
- **Backend:** Express 4, Drizzle ORM, PostgreSQL, BullMQ, ioredis
- **MCP:** @modelcontextprotocol/sdk, tsup builds
- **Testing:** Vitest, Supertest
- **Monitoring:** Sentry
- **CI:** GitHub Actions (build → parallel test jobs, lint with continue-on-error)
- **Deploy:** Railway (private networking between services)
