import crypto from "node:crypto";
import { createReadStream } from "node:fs";
import { access } from "node:fs/promises";
import { resolve } from "node:path";
import { Pool } from "pg";
import { Router } from "express";
import { enqueueReportJob, getReportJob } from "../reports/store";

const outputDir = resolve(process.env.REPORT_OUTPUT_DIR || "output", "pdf");
export function createReportRouter(pool: Pool | null): Router {
  const router = Router();
  router.post("/reports/task-summary", async (req, res, next) => { try {
    if (!pool) return res.status(503).json({ error: "Reports require PostgreSQL. Set DATABASE_URL and start the report worker." });
    const key = req.header("Idempotency-Key")?.trim() || `generated-${crypto.randomUUID()}`; if (key.length > 200) return res.status(400).json({ error: "Invalid Idempotency-Key" });
    const queued = await enqueueReportJob(key); res.setHeader("Location", `/reports/jobs/${queued.job.id}`);
    return res.status(202).json({ jobId: queued.job.id, status: queued.job.status, reused: queued.reused, statusUrl: `/reports/jobs/${queued.job.id}` });
  } catch (error) { next(error); } });
  router.get("/reports/jobs/:jobId", async (req, res, next) => { try { const job = await getReportJob(req.params.jobId); if (!job) return res.status(404).json({ error: "Report job not found" });
    return res.json({ jobId: job.id, status: job.status, attempts: job.attempts, createdAt: job.createdAt, updatedAt: job.updatedAt,
      ...(job.status === "completed" ? { downloadUrl: `/reports/files/${job.artifactFilename}` } : {}), ...(job.status === "failed" ? { error: "Report generation failed. Check worker logs." } : {}) });
  } catch (error) { next(error); } });
  router.get("/reports/files/:filename", async (req, res, next) => { try { const filename = req.params.filename;
    if (!/^task-summary-[0-9a-f-]{36}\.pdf$/i.test(filename)) return res.status(404).json({ error: "Report not found" }); const path = resolve(outputDir, filename); await access(path);
    res.setHeader("Content-Type", "application/pdf"); res.setHeader("Content-Disposition", `attachment; filename=\"${filename}\"`); createReadStream(path).pipe(res);
  } catch (error) { next(error); } }); return router;
}
