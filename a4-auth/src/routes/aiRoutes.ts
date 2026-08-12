import crypto from "node:crypto";
import { Router } from "express";
import { asyncRoute } from "../asyncRoute";
import { triageInputSchema } from "../llm/schema";
import { enqueueJob, getJob } from "../jobs/store";
import { toPublicJob } from "../jobs/types";

export function createAiRouter(): Router {
  const router = Router();

  router.post("/ai/triage", asyncRoute(async (req, res) => {
    const input = triageInputSchema.safeParse(req.body);
    if (!input.success) {
      const issue = input.error.issues[0];
      return res.status(400).json({
        error: "Invalid request",
        field: issue?.path.join(".") || "body",
        message: issue?.message || "Request body is invalid",
      });
    }

    if (process.env.LLM_ENABLED === "false") {
      return res.status(503).json({
        error: "AI triage is disabled",
        message: "The feature was turned off with the LLM_ENABLED kill switch.",
      });
    }

    const headerKey = req.header("Idempotency-Key");
    const idempotencyKey = headerKey?.trim() || `generated-${crypto.randomUUID()}`;
    if (idempotencyKey.length > 200) {
      return res.status(400).json({ error: "Invalid Idempotency-Key", message: "Maximum length is 200 characters." });
    }

    const queued = await enqueueJob(input.data, idempotencyKey);
    res.setHeader("Location", `/ai/triage/jobs/${queued.job.id}`);
    return res.status(202).json({
      jobId: queued.job.id,
      status: queued.job.status,
      reused: queued.reused,
      statusUrl: `/ai/triage/jobs/${queued.job.id}`,
    });
  }));

  router.get("/ai/triage/jobs/:jobId", asyncRoute(async (req, res) => {
    const job = await getJob(req.params.jobId);
    if (!job) return res.status(404).json({ error: "Job not found" });
    return res.json(toPublicJob(job));
  }));

  return router;
}
