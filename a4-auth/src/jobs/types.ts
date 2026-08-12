import { TriageInput, TriageResult } from "../llm/schema";

export type JobStatus = "queued" | "processing" | "completed" | "failed";

export interface TriageJob {
  id: string;
  idempotencyKeyHash: string;
  status: JobStatus;
  input: TriageInput;
  attempts: number;
  maxAttempts: number;
  createdAt: string;
  updatedAt: string;
  nextAttemptAt: string;
  startedAt?: string;
  completedAt?: string;
  result?: TriageResult;
  error?: string;
}

export interface PublicTriageJob {
  jobId: string;
  status: JobStatus;
  attempts: number;
  maxAttempts: number;
  createdAt: string;
  updatedAt: string;
  result?: TriageResult;
  error?: string;
}

export function toPublicJob(job: TriageJob): PublicTriageJob {
  return {
    jobId: job.id,
    status: job.status,
    attempts: job.attempts,
    maxAttempts: job.maxAttempts,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
    ...(job.result ? { result: job.result } : {}),
    ...(job.status === "failed" ? { error: `Job failed after ${job.attempts} attempts.` } : {}),
  };
}
