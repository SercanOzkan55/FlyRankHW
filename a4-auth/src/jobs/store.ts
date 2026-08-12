import { createHash, randomUUID } from "node:crypto";
import { mkdir, open, readFile, readdir, rename, stat, unlink, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { TriageInput, TriageResult } from "../llm/schema";
import { TriageJob } from "./types";

const root = resolve(process.env.JOB_DATA_DIR || "data", "ai-jobs");
const jobsDir = resolve(root, "jobs");
const locksDir = resolve(root, "locks");
const keysDir = resolve(root, "idempotency");

async function ensureDirectories(): Promise<void> {
  await Promise.all([
    mkdir(jobsDir, { recursive: true }),
    mkdir(locksDir, { recursive: true }),
    mkdir(keysDir, { recursive: true }),
  ]);
}

function keyHash(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

async function acquireLock(name: string): Promise<(() => Promise<void>) | null> {
  await ensureDirectories();
  const path = resolve(locksDir, `${name}.lock`);
  try {
    const handle = await open(path, "wx");
    await handle.writeFile(JSON.stringify({ pid: process.pid, createdAt: new Date().toISOString() }));
    await handle.close();
    return async () => { await unlink(path).catch(() => undefined); };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "EEXIST") {
      try {
        const lock = await stat(path);
        if (Date.now() - lock.mtimeMs > 30_000) {
          await unlink(path);
          return acquireLock(name);
        }
      } catch {
        return acquireLock(name);
      }
      return null;
    }
    throw error;
  }
}

async function waitForLock(name: string): Promise<() => Promise<void>> {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const release = await acquireLock(name);
    if (release) return release;
    await new Promise((resolveWait) => setTimeout(resolveWait, 20));
  }
  throw new Error("The job store is busy. Try again.");
}

function jobPath(id: string): string {
  return resolve(jobsDir, `${id}.json`);
}

async function writeJob(job: TriageJob): Promise<void> {
  const path = jobPath(job.id);
  const temporary = `${path}.${process.pid}.${randomUUID()}.tmp`;
  await writeFile(temporary, JSON.stringify(job, null, 2), "utf8");
  await rename(temporary, path);
}

export async function getJob(id: string): Promise<TriageJob | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  await ensureDirectories();
  try {
    return JSON.parse(await readFile(jobPath(id), "utf8")) as TriageJob;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

export async function enqueueJob(
  input: TriageInput,
  idempotencyKey: string
): Promise<{ job: TriageJob; reused: boolean }> {
  const hash = keyHash(idempotencyKey);
  const release = await waitForLock(`key-${hash}`);
  try {
    const indexPath = resolve(keysDir, `${hash}.txt`);
    try {
      const existingId = (await readFile(indexPath, "utf8")).trim();
      const existing = await getJob(existingId);
      if (existing) return { job: existing, reused: true };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }

    const now = new Date().toISOString();
    const job: TriageJob = {
      id: randomUUID(),
      idempotencyKeyHash: hash,
      status: "queued",
      input,
      attempts: 0,
      maxAttempts: Math.min(Math.max(Number(process.env.JOB_MAX_ATTEMPTS || 3), 1), 5),
      createdAt: now,
      updatedAt: now,
      nextAttemptAt: now,
    };
    await writeJob(job);
    await writeFile(indexPath, job.id, "utf8");
    return { job, reused: false };
  } finally {
    await release();
  }
}

export async function claimNextJob(): Promise<TriageJob | null> {
  await ensureDirectories();
  const files = (await readdir(jobsDir)).filter((file) => file.endsWith(".json")).sort();
  const now = Date.now();
  const staleMs = Math.max(Number(process.env.JOB_STALE_MS || 130_000), 60_000);

  for (const file of files) {
    const id = file.slice(0, -5);
    const release = await acquireLock(`job-${id}`);
    if (!release) continue;
    try {
      const job = await getJob(id);
      if (!job || job.status === "completed" || job.status === "failed") continue;
      const processingIsStale = job.status === "processing" &&
        now - Date.parse(job.startedAt || job.updatedAt) >= staleMs;
      const queuedIsReady = job.status === "queued" && Date.parse(job.nextAttemptAt) <= now;
      if (!processingIsStale && !queuedIsReady) continue;

      const updated: TriageJob = {
        ...job,
        status: "processing",
        attempts: job.attempts + 1,
        startedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        error: undefined,
      };
      await writeJob(updated);
      return updated;
    } finally {
      await release();
    }
  }
  return null;
}

export async function completeJob(id: string, result: TriageResult): Promise<void> {
  const release = await waitForLock(`job-${id}`);
  try {
    const job = await getJob(id);
    if (!job || job.status === "completed") return;
    const now = new Date().toISOString();
    await writeJob({ ...job, status: "completed", result, error: undefined, completedAt: now, updatedAt: now });
  } finally {
    await release();
  }
}

export async function failOrRetryJob(
  id: string,
  message: string,
  retryable: boolean
): Promise<TriageJob | null> {
  const release = await waitForLock(`job-${id}`);
  try {
    const job = await getJob(id);
    if (!job || job.status === "completed") return job;
    const exhausted = !retryable || job.attempts >= job.maxAttempts;
    const now = new Date();
    const retryDelayMs = Math.min(1000 * 2 ** Math.max(job.attempts - 1, 0), 30_000);
    const updated: TriageJob = {
      ...job,
      status: exhausted ? "failed" : "queued",
      error: message,
      updatedAt: now.toISOString(),
      nextAttemptAt: new Date(now.getTime() + retryDelayMs).toISOString(),
      ...(exhausted ? { completedAt: now.toISOString() } : {}),
    };
    await writeJob(updated);
    return updated;
  } finally {
    await release();
  }
}
