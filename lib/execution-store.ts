import type {
  ExecutionDecision,
  ExecutionLog,
  WorkflowRunRecord,
} from "@/lib/workflow-types";

declare global {
  var __branchlineRuns: Map<string, WorkflowRunRecord> | undefined;
}

const runStore = globalThis.__branchlineRuns ?? new Map<string, WorkflowRunRecord>();
globalThis.__branchlineRuns = runStore;

function now() {
  return new Date().toISOString();
}

function log(message: string, level: ExecutionLog["level"] = "info"): ExecutionLog {
  return {
    id: crypto.randomUUID(),
    level,
    message,
    timestamp: now(),
  };
}

export function createRun(runId: string): WorkflowRunRecord {
  const timestamp = now();
  const record: WorkflowRunRecord = {
    runId,
    status: "queued",
    startedAt: timestamp,
    updatedAt: timestamp,
    decisions: [],
    logs: [log("Run queued for durable execution")],
  };
  runStore.set(runId, record);

  if (runStore.size > 30) {
    const oldest = runStore.keys().next().value;
    if (oldest) runStore.delete(oldest);
  }

  return record;
}

export function getRun(runId: string) {
  return runStore.get(runId);
}

export function updateRun(
  runId: string,
  patch: Partial<Omit<WorkflowRunRecord, "runId" | "startedAt">>,
) {
  const current = runStore.get(runId);
  if (!current) return;
  runStore.set(runId, { ...current, ...patch, updatedAt: now() });
}

export function addRunLog(
  runId: string,
  message: string,
  level: ExecutionLog["level"] = "info",
) {
  const current = runStore.get(runId);
  if (!current) return;
  updateRun(runId, { logs: [...current.logs, log(message, level)] });
}

export function addDecision(runId: string, decision: ExecutionDecision) {
  const current = runStore.get(runId);
  if (!current) return;
  updateRun(runId, { decisions: [...current.decisions, decision] });
}
