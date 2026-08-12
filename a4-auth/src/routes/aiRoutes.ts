import { Router } from "express";
import { asyncRoute } from "../asyncRoute";
import { runTriage, TriageValidationError } from "../llm/triage";
import { LlmProviderError, LlmTimeoutError } from "../llm/client";
import { triageInputSchema, triageResultSchema, STUB_TRIAGE_RESULT } from "../llm/schema";

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

    if (process.env.LLM_STUB === "1") {
      return res.json(triageResultSchema.parse(STUB_TRIAGE_RESULT));
    }

    try {
      const run = await runTriage(input.data);
      return res.json(run.result);
    } catch (error) {
      if (error instanceof TriageValidationError) {
        return res.status(422).json({
          error: "Invalid model output",
          message: error.message,
        });
      }
      if (error instanceof LlmTimeoutError) {
        return res.status(504).json({
          error: "Model timeout",
          message: error.message,
        });
      }
      if (error instanceof LlmProviderError) {
        return res.status(502).json({
          error: "Model provider error",
          message: "The provider request failed and no untrusted model text was returned.",
          providerStatus: error.status || null,
        });
      }
      throw error;
    }
  }));

  return router;
}
