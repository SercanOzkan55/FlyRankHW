import "dotenv/config";
import { appendFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { runTriage } from "../llm/triage";
import { TriageValidationError } from "../llm/triage";
import { LlmProviderError, LlmTimeoutError } from "../llm/client";
import { STUB_TRIAGE_RESULT, triageResultSchema } from "../llm/schema";
import { claimNextJob, completeJob, failOrRetryJob } from "./store";

const pollMs = Math.max(Number(process.env.WORKER_POLL_MS || 500), 100);
let stopping = false;

function safeError(error: unknown): string {
  if (error instanceof Error) return error.message.slice(0, 500);
  return "Unknown worker error";
}

function isRetryable(error: unknown): boolean {
  if (error instanceof LlmTimeoutError || error instanceof TriageValidationError) return true;
  if (error instanceof LlmProviderError) {
    return error.status === 429 || (error.status !== undefined && error.status >= 500);
  }
  return false;
}

async function alertFailedJob(jobId: string, attempts: number, error: string): Promise<void> {
  const alert = {
    event: "ai_job_failed_permanently",
    jobId,
    attempts,
    error,
    timestamp: new Date().toISOString(),
  };
  console.error(JSON.stringify(alert));
  const alertPath = resolve("logs", "job-alerts.jsonl");
  await mkdir(dirname(alertPath), { recursive: true });
  await appendFile(alertPath, `${JSON.stringify(alert)}\n`, "utf8");
}

async function processOne(): Promise<boolean> {
  const job = await claimNextJob();
  if (!job) return false;
  console.log(JSON.stringify({ event: "ai_job_started", jobId: job.id, attempt: job.attempts }));
  try {
    const result = process.env.LLM_STUB === "1"
      ? triageResultSchema.parse(STUB_TRIAGE_RESULT)
      : (await runTriage(job.input)).result;
    await completeJob(job.id, result);
    console.log(JSON.stringify({ event: "ai_job_completed", jobId: job.id, attempt: job.attempts }));
  } catch (error) {
    const message = safeError(error);
    const updated = await failOrRetryJob(job.id, message, isRetryable(error));
    console.error(JSON.stringify({
      event: updated?.status === "failed" ? "ai_job_exhausted" : "ai_job_retry_scheduled",
      jobId: job.id,
      attempt: job.attempts,
      error: message,
    }));
    if (updated?.status === "failed") await alertFailedJob(job.id, updated.attempts, message);
  }
  return true;
}

async function main(): Promise<void> {
  console.log(JSON.stringify({ event: "ai_worker_started", pollMs, pid: process.pid }));
  while (!stopping) {
    const processed = await processOne();
    if (!processed) await new Promise((resolveWait) => setTimeout(resolveWait, pollMs));
  }
}

process.on("SIGINT", () => { stopping = true; });
process.on("SIGTERM", () => { stopping = true; });

main().catch((error: unknown) => {
  console.error("Worker stopped unexpectedly:", safeError(error));
  process.exitCode = 1;
});
