import { createHash, randomUUID } from "node:crypto";
import { mkdir, open, readFile, readdir, rename, unlink, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { TaskSummaryReportJob } from "./types";

const root = resolve(process.env.REPORT_DATA_DIR || "data", "report-jobs");
const jobsDir = resolve(root, "jobs");
const locksDir = resolve(root, "locks");
const keysDir = resolve(root, "idempotency");
const ensureDirectories = () => Promise.all([mkdir(jobsDir, { recursive: true }), mkdir(locksDir, { recursive: true }), mkdir(keysDir, { recursive: true })]);
const hash = (value: string) => createHash("sha256").update(value).digest("hex");
const jobPath = (id: string) => resolve(jobsDir, `${id}.json`);

async function lock(name: string): Promise<() => Promise<void>> {
  await ensureDirectories(); const path = resolve(locksDir, `${name}.lock`);
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try { const handle = await open(path, "wx"); await handle.close(); return async () => { await unlink(path).catch(() => undefined); }; }
    catch (error) { if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error; await new Promise((done) => setTimeout(done, 20)); }
  } throw new Error("Report job store is busy. Try again.");
}
async function writeJob(job: TaskSummaryReportJob): Promise<void> {
  const path = jobPath(job.id); const temp = `${path}.${process.pid}.${randomUUID()}.tmp`;
  await writeFile(temp, JSON.stringify(job, null, 2), "utf8"); await rename(temp, path);
}
export async function getReportJob(id: string): Promise<TaskSummaryReportJob | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null; await ensureDirectories();
  try { return JSON.parse(await readFile(jobPath(id), "utf8")) as TaskSummaryReportJob; }
  catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return null; throw error; }
}
export async function enqueueReportJob(key: string): Promise<{ job: TaskSummaryReportJob; reused: boolean }> {
  const keyHash = hash(key); const release = await lock(`key-${keyHash}`);
  try {
    const indexPath = resolve(keysDir, `${keyHash}.txt`); const existingId = await readFile(indexPath, "utf8").then((value) => value.trim()).catch(() => "");
    if (existingId) { const existing = await getReportJob(existingId); if (existing) return { job: existing, reused: true }; }
    const now = new Date().toISOString(); const job: TaskSummaryReportJob = { id: randomUUID(), idempotencyKeyHash: keyHash, status: "queued", attempts: 0, maxAttempts: 3, createdAt: now, updatedAt: now };
    await writeJob(job); await writeFile(indexPath, job.id, "utf8"); return { job, reused: false };
  } finally { await release(); }
}
export async function claimNextReportJob(): Promise<TaskSummaryReportJob | null> {
  await ensureDirectories();
  for (const file of (await readdir(jobsDir)).filter((name) => name.endsWith(".json")).sort()) {
    const id = file.slice(0, -5); let release: (() => Promise<void>) | null = null;
    try { release = await lock(`job-${id}`); const job = await getReportJob(id); if (!job || job.status !== "queued") continue;
      const updated = { ...job, status: "processing" as const, attempts: job.attempts + 1, startedAt: new Date().toISOString(), updatedAt: new Date().toISOString() }; await writeJob(updated); return updated;
    } finally { if (release) await release(); }
  } return null;
}
export async function finishReportJob(id: string, artifactFilename?: string, error?: string): Promise<void> {
  const release = await lock(`job-${id}`); try { const job = await getReportJob(id); if (!job || job.status === "completed") return; const now = new Date().toISOString();
    await writeJob({ ...job, status: artifactFilename ? "completed" : "failed", artifactFilename, error, completedAt: now, updatedAt: now });
  } finally { await release(); }
}
