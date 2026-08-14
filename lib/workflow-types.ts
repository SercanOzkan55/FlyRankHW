import type { Edge, Node } from "@xyflow/react";

export type BranchValue = "YES" | "NO";
export type NodeRunStatus = "idle" | "active" | "complete" | "failed";

export type DecisionNodeData = {
  label: string;
  prompt: string;
  status?: NodeRunStatus;
  result?: BranchValue;
  order?: number;
};

export type DecisionFlowNode = Node<DecisionNodeData, "decision">;
export type DecisionFlowEdge = Edge<{ branch: BranchValue }>;

export interface WorkflowDefinition {
  name: string;
  startNodeId: string;
  nodes: Array<{
    id: string;
    type: "decision";
    position: { x: number; y: number };
    data: Pick<DecisionNodeData, "label" | "prompt">;
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
    sourceHandle: BranchValue;
    data: { branch: BranchValue };
  }>;
}

export interface ExecutionDecision {
  nodeId: string;
  label: string;
  prompt: string;
  result: BranchValue;
  order: number;
  edgeId?: string;
  provider: "openai" | "demo";
  durationMs: number;
  timestamp: string;
}

export interface ExecutionLog {
  id: string;
  level: "info" | "success" | "error";
  message: string;
  timestamp: string;
}

export interface WorkflowRunRecord {
  runId: string;
  status: "queued" | "running" | "completed" | "failed";
  startedAt: string;
  updatedAt: string;
  activeNodeId?: string;
  activeEdgeId?: string;
  decisions: ExecutionDecision[];
  logs: ExecutionLog[];
  error?: string;
}

export interface WorkflowRunPayload {
  runId: string;
  input: string;
  workflow: WorkflowDefinition;
}
