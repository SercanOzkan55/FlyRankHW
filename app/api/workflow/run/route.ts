import { createRun, updateRun } from "@/lib/execution-store";
import { inngest } from "@/lib/inngest/client";
import type { WorkflowRunPayload } from "@/lib/workflow-types";

export async function POST(request: Request) {
  let body: Omit<WorkflowRunPayload, "runId">;
  try {
    body = (await request.json()) as Omit<WorkflowRunPayload, "runId">;
  } catch {
    return Response.json({ error: "The run payload is not valid JSON." }, { status: 400 });
  }

  if (!body.input?.trim() || !body.workflow?.nodes?.length) {
    return Response.json(
      { error: "A workflow input and at least one decision node are required." },
      { status: 400 },
    );
  }

  const runId = crypto.randomUUID();
  const payload: WorkflowRunPayload = { ...body, runId };
  createRun(runId);

  try {
    await inngest.send({
      id: runId,
      name: "workflow/execute",
      data: payload,
    });
    return Response.json({ runId, status: "queued" }, { status: 202 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to reach Inngest";
    updateRun(runId, { status: "failed", error: message });
    return Response.json(
      {
        runId,
        error: "Inngest is not reachable. Start the local Inngest server and try again.",
        detail: message,
      },
      { status: 503 },
    );
  }
}
