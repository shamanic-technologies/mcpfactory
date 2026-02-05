/**
 * HTTP client for runs-service
 * Centralized run tracking and cost management
 */

const RUNS_SERVICE_URL = process.env.RUNS_SERVICE_URL || "https://runs.mcpfactory.org";
const RUNS_SERVICE_API_KEY = process.env.RUNS_SERVICE_API_KEY || "";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Run {
  id: string;
  parentRunId: string | null;
  organizationId: string;
  userId: string | null;
  serviceName: string;
  taskName: string;
  status: string;
  startedAt: string;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RunCost {
  id: string;
  runId: string;
  costName: string;
  quantity: string;
  unitCostInUsdCents: string;
  totalCostInUsdCents: string;
  createdAt: string;
}

export interface RunWithCosts extends Run {
  costs: RunCost[];
  ownCostInUsdCents: string;
  childrenCostInUsdCents: string;
  totalCostInUsdCents: string;
}

export interface RunsOrganization {
  id: string;
  externalId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRunParams {
  organizationId: string;
  serviceName: string;
  taskName: string;
  parentRunId?: string;
  userId?: string;
}

export interface CostItem {
  costName: string;
  quantity: number;
}

export interface ListRunsParams {
  organizationId: string;
  serviceName?: string;
  taskName?: string;
  userId?: string;
  status?: string;
  startedAfter?: string;
  startedBefore?: string;
  limit?: number;
  offset?: number;
}

export interface RunSummaryParams {
  organizationId: string;
  serviceName?: string;
  startedAfter?: string;
  startedBefore?: string;
  groupBy?: "costName" | "userId" | "serviceName";
}

export interface SummaryBreakdown {
  key: string;
  totalCostInUsdCents: string;
  totalQuantity?: string;
  runCount?: number;
}

// ─── HTTP helpers ────────────────────────────────────────────────────────────

async function runsRequest<T>(
  path: string,
  options: { method?: string; body?: unknown } = {}
): Promise<T> {
  const { method = "GET", body } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-API-Key": RUNS_SERVICE_API_KEY,
  };

  const response = await fetch(`${RUNS_SERVICE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`runs-service ${method} ${path} failed: ${response.status} - ${errorText}`);
  }

  return response.json() as Promise<T>;
}

// ─── Org cache (in-memory, per process) ──────────────────────────────────────

const orgCache = new Map<string, string>(); // clerkOrgId → runs-service orgId

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Ensure organization exists in runs-service.
 * Uses clerkOrgId as externalId. Caches result in memory.
 * Returns the runs-service organization UUID.
 */
export async function ensureOrganization(clerkOrgId: string): Promise<string> {
  const cached = orgCache.get(clerkOrgId);
  if (cached) return cached;

  const org = await runsRequest<RunsOrganization>("/v1/organizations", {
    method: "POST",
    body: { externalId: clerkOrgId },
  });

  orgCache.set(clerkOrgId, org.id);
  return org.id;
}

/**
 * Create a new run in runs-service.
 */
export async function createRun(params: CreateRunParams): Promise<Run> {
  return runsRequest<Run>("/v1/runs", {
    method: "POST",
    body: params,
  });
}

/**
 * Update run status (completed or failed).
 */
export async function updateRun(
  runId: string,
  status: "completed" | "failed"
): Promise<Run> {
  return runsRequest<Run>(`/v1/runs/${runId}`, {
    method: "PATCH",
    body: { status },
  });
}

/**
 * Add cost line items to a run.
 * Cost names must be registered in costs-service.
 */
export async function addCosts(
  runId: string,
  items: CostItem[]
): Promise<{ costs: RunCost[] }> {
  return runsRequest<{ costs: RunCost[] }>(`/v1/runs/${runId}/costs`, {
    method: "POST",
    body: { items },
  });
}

/**
 * Get a single run with costs (including recursive children costs).
 */
export async function getRun(runId: string): Promise<RunWithCosts> {
  return runsRequest<RunWithCosts>(`/v1/runs/${runId}`);
}

/**
 * List runs with filters.
 */
export async function listRuns(
  params: ListRunsParams
): Promise<{ runs: Run[]; limit: number; offset: number }> {
  const searchParams = new URLSearchParams();
  searchParams.set("organizationId", params.organizationId);
  if (params.serviceName) searchParams.set("serviceName", params.serviceName);
  if (params.taskName) searchParams.set("taskName", params.taskName);
  if (params.userId) searchParams.set("userId", params.userId);
  if (params.status) searchParams.set("status", params.status);
  if (params.startedAfter) searchParams.set("startedAfter", params.startedAfter);
  if (params.startedBefore) searchParams.set("startedBefore", params.startedBefore);
  if (params.limit) searchParams.set("limit", String(params.limit));
  if (params.offset) searchParams.set("offset", String(params.offset));

  return runsRequest<{ runs: Run[]; limit: number; offset: number }>(
    `/v1/runs?${searchParams.toString()}`
  );
}

/**
 * Fetch multiple runs with costs in parallel.
 * Returns a Map of runId → RunWithCosts.
 */
export async function getRunsBatch(
  runIds: string[]
): Promise<Map<string, RunWithCosts>> {
  if (runIds.length === 0) return new Map();
  const results = await Promise.all(runIds.map((id) => getRun(id)));
  return new Map(results.map((r) => [r.id, r]));
}

/**
 * Get aggregated cost summary.
 */
export async function getRunSummary(
  params: RunSummaryParams
): Promise<{ breakdown: SummaryBreakdown[] }> {
  const searchParams = new URLSearchParams();
  searchParams.set("organizationId", params.organizationId);
  if (params.serviceName) searchParams.set("serviceName", params.serviceName);
  if (params.startedAfter) searchParams.set("startedAfter", params.startedAfter);
  if (params.startedBefore) searchParams.set("startedBefore", params.startedBefore);
  if (params.groupBy) searchParams.set("groupBy", params.groupBy);

  return runsRequest<{ breakdown: SummaryBreakdown[] }>(
    `/v1/runs/summary?${searchParams.toString()}`
  );
}
