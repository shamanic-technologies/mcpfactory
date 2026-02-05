/**
 * Mock for @mcpfactory/runs-client
 * Used in tests since the workspace package may not be built in CI
 */

export type Run = {
  id: string;
  clerkOrgId: string;
  status: string;
  startedAt: string;
  completedAt: string | null;
};

export type RunWithCosts = Run & {
  totalCostInUsdCents: number | null;
  costs: Array<{ provider: string; model: string; amountInUsdCents: number }>;
};

export type CreateRunParams = {
  clerkOrgId: string;
  status?: string;
};

export type CostItem = {
  provider: string;
  model: string;
  amountInUsdCents: number;
};

export type ListRunsParams = {
  clerkOrgId: string;
  limit?: number;
  offset?: number;
};

export async function ensureOrganization(_clerkOrgId: string): Promise<void> {}

export async function createRun(_params: CreateRunParams): Promise<Run> {
  return {
    id: "mock-run-id",
    clerkOrgId: "mock-org",
    status: "running",
    startedAt: new Date().toISOString(),
    completedAt: null,
  };
}

export async function updateRun(_runId: string, _data: Partial<Run>): Promise<Run> {
  return {
    id: _runId,
    clerkOrgId: "mock-org",
    status: "completed",
    startedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
  };
}

export async function addCosts(_runId: string, _costs: CostItem[]): Promise<void> {}

export async function listRuns(_params: ListRunsParams): Promise<Run[]> {
  return [];
}

export async function getRun(_runId: string): Promise<RunWithCosts | null> {
  return null;
}

export async function getRunsBatch(_runIds: string[]): Promise<Map<string, RunWithCosts>> {
  return new Map();
}
