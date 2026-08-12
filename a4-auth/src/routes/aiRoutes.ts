import { Router } from "express";
import { asyncRoute } from "../asyncRoute";
import { requestTriageCompletion } from "../llm/client";
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

    if (process.env.LLM_STUB === "1") {
      return res.json(triageResultSchema.parse(STUB_TRIAGE_RESULT));
    }

    const raw = await requestTriageCompletion(input.data);
    return res.type("text/plain").send(raw.content);
  }));

  return router;
}
