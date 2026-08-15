import "dotenv/config";
import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createPool } from "../db";
import { queryTaskSummary } from "./query";
import { claimNextReportJob, finishReportJob } from "./store";

const pollMs = Math.max(Number(process.env.REPORT_WORKER_POLL_MS || 500), 100);
const outputDir = resolve(process.env.REPORT_OUTPUT_DIR || "output", "pdf");
const generator = resolve("scripts", "generate_task_summary.py");
let stopping = false;

function generatePdf(inputPath: string, outputPath: string): Promise<void> {
  return new Promise((resolveRun, reject) => {
    const child = spawn(process.env.PYTHON_BIN || "python", [generator, inputPath, outputPath]); let stderr = "";
    child.stderr.on("data", (chunk) => { stderr += String(chunk); }); child.on("error", reject);
    child.on("close", (code) => code === 0 ? resolveRun() : reject(new Error(stderr || `PDF generator exited with code ${code}`)));
  });
}
async function processOne(): Promise<boolean> {
  const job = await claimNextReportJob(); if (!job) return false;
  try {
    const pool = createPool(); const summary = await queryTaskSummary(pool); await pool.end(); await mkdir(outputDir, { recursive: true });
    const filename = `task-summary-${job.id}.pdf`; const input = resolve(outputDir, `${job.id}.json`); const output = resolve(outputDir, filename);
    await writeFile(input, JSON.stringify({ generatedAt: new Date().toISOString(), summary }), "utf8"); await generatePdf(input, output); await finishReportJob(job.id, filename);
    console.log(JSON.stringify({ event: "report_job_completed", jobId: job.id, artifact: filename }));
  } catch (error) { await finishReportJob(job.id, undefined, error instanceof Error ? error.message : "Unknown report worker error"); console.error(JSON.stringify({ event: "report_job_failed", jobId: job.id })); }
  return true;
}
async function main(): Promise<void> { while (!stopping) { if (!(await processOne())) await new Promise((done) => setTimeout(done, pollMs)); } }
process.on("SIGINT", () => { stopping = true; }); process.on("SIGTERM", () => { stopping = true; });
main().catch((error) => { console.error(error); process.exitCode = 1; });
