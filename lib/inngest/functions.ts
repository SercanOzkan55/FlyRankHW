import OpenAI from "openai";

import {
  addDecision,
  addRunLog,
  updateRun,
} from "@/lib/execution-store";
import { inngest } from "@/lib/inngest/client";
import type {
  BranchValue,
  WorkflowRunPayload,
} from "@/lib/workflow-types";

function demoDecision(prompt: string, input: string): BranchValue {
  const question = prompt.toLowerCase();
  const context = input.toLowerCase();
  const matches = (terms: string[]) => terms.some((term) => context.includes(term));

  if (question.includes("support")) {
    return matches(["help", "locked", "error", "issue", "broken", "cannot", "can't"])
      ? "YES"
      : "NO";
  }
  if (question.includes("urgent") || question.includes("priority") || question.includes("escalat")) {
    return matches(["urgent", "locked", "outage", "down", "blocked", "one hour", "asap"])
      ? "YES"
      : "NO";
  }
  if (question.includes("pricing") || question.includes("sales") || question.includes("qualified")) {
    return matches(["pricing", "demo", "buy", "purchase", "quote", "budget"])
      ? "YES"
      : "NO";
  }
  if (question.includes("help center") || question.includes("self-serve")) {
    return matches(["how do i", "documentation", "guide", "article"])
      ? "YES"
      : "NO";
  }

  const checksum = `${prompt}:${input}`
    .split("")
    .reduce((sum, character) => sum + character.charCodeAt(0), 0);
  return checksum % 2 === 0 ? "YES" : "NO";
}

async function classifyDecision(prompt: string, input: string) {
  const startedAt = Date.now();
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return {
      result: demoDecision(prompt, input),
      provider: "demo" as const,
      durationMs: Date.now() - startedAt,
    };
  }

  const client = new OpenAI({ apiKey });
  const response = await client.responses.create({
    model: process.env.OPENAI_MODEL || "gpt-5.5",
    instructions:
      "You are a binary workflow decision engine. Evaluate the supplied input against the decision question. Return exactly YES or NO in uppercase. Do not add punctuation, reasoning, markdown, or any other text.",
    input: `WORKFLOW INPUT:\n${input}\n\nDECISION QUESTION:\n${prompt}`,
    max_output_tokens: 8,
  });

  const result = response.output_text.trim().toUpperCase();
  if (result !== "YES" && result !== "NO") {
    throw new Error(`The model returned an invalid binary decision: ${response.output_text}`);
  }

  return {
    result: result as BranchValue,
    provider: "openai" as const,
    durationMs: Date.now() - startedAt,
  };
}

type WorkflowStepRunner = (
  name: string,
  handler: () => unknown | Promise<unknown>,
) => Promise<any>;

export async function runWorkflowPayload(
  payload: WorkflowRunPayload,
  runStep: WorkflowStepRunner,
) {
  const { runId, workflow, input } = payload;
  const nodeById = new Map(workflow.nodes.map((node) => [node.id, node]));
  const visited = new Set<string>();
  let currentNodeId = workflow.startNodeId;
  let order = 0;

  await runStep("initialize-run", () => {
    updateRun(runId, { status: "running" });
    addRunLog(runId, `Execution started at ${nodeById.get(currentNodeId)?.data.label ?? currentNodeId}`);
    return { started: true };
  });

  while (currentNodeId) {
    if (visited.has(currentNodeId)) {
      throw new Error(`Cycle detected at node ${currentNodeId}`);
    }
    if (order >= workflow.nodes.length) {
      throw new Error("Execution exceeded the workflow node limit");
    }

    const node = nodeById.get(currentNodeId);
    if (!node) throw new Error(`Node ${currentNodeId} could not be found`);

    visited.add(currentNodeId);
    order += 1;
    const stepNumber = order;

    await runStep(`activate-${stepNumber}-${node.id}`, () => {
      updateRun(runId, { activeNodeId: node.id, activeEdgeId: undefined });
      addRunLog(runId, `Step ${stepNumber} - Evaluating ${node.data.label}`);
      return { nodeId: node.id };
    });

    const decision = await runStep(`decision-${stepNumber}-${node.id}`, () =>
      classifyDecision(node.data.prompt, input),
    );

    const selectedEdge = workflow.edges.find(
      (edge) =>
        edge.source === node.id &&
        (edge.data.branch === decision.result || edge.sourceHandle === decision.result),
    );

    await runStep(`record-${stepNumber}-${node.id}`, () => {
      addDecision(runId, {
        nodeId: node.id,
        label: node.data.label,
        prompt: node.data.prompt,
        result: decision.result,
        order: stepNumber,
        edgeId: selectedEdge?.id,
        provider: decision.provider,
        durationMs: decision.durationMs,
        timestamp: new Date().toISOString(),
      });
      updateRun(runId, {
        activeNodeId: selectedEdge ? undefined : node.id,
        activeEdgeId: selectedEdge?.id,
      });
      addRunLog(
        runId,
        `${node.data.label} returned ${decision.result}${selectedEdge ? ` -> ${nodeById.get(selectedEdge.target)?.data.label ?? selectedEdge.target}` : " - End of branch"}`,
        "success",
      );
      return { selectedEdgeId: selectedEdge?.id ?? null };
    });

    currentNodeId = selectedEdge?.target ?? "";
  }

  await runStep("complete-run", () => {
    updateRun(runId, {
      status: "completed",
      activeNodeId: undefined,
      activeEdgeId: undefined,
    });
    addRunLog(runId, `Workflow completed in ${order} decision${order === 1 ? "" : "s"}`, "success");
    return { completed: true, decisions: order };
  });

  return { runId, decisions: order, status: "completed" };
}

export const executeWorkflow = inngest.createFunction(
  {
    id: "execute-branchline-workflow",
    name: "Execute Branchline workflow",
    description: "Traverses decision nodes and checkpoints every AI branch.",
    triggers: [{ event: "workflow/execute" }],
    retries: 2,
    onFailure: async ({ event, error }) => {
      const original = event.data.event as { data?: Partial<WorkflowRunPayload> };
      const runId = original.data?.runId;
      if (!runId) return;
      updateRun(runId, {
        status: "failed",
        activeNodeId: undefined,
        activeEdgeId: undefined,
        error: error.message,
      });
      addRunLog(runId, `Run failed after retries: ${error.message}`, "error");
    },
  },
  async ({ event, step }) =>
    runWorkflowPayload(event.data as unknown as WorkflowRunPayload, (name, handler) =>
      step.run(name, handler),
    ),
);

export const functions = [executeWorkflow];
