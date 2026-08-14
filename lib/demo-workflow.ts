import type { DecisionFlowEdge, DecisionFlowNode } from "@/lib/workflow-types";

export const demoNodes: DecisionFlowNode[] = [
  {
    id: "request-type",
    type: "decision",
    position: { x: 110, y: 160 },
    data: {
      label: "Request type",
      prompt: "Is this a customer support request?",
      status: "idle",
    },
  },
  {
    id: "urgency-check",
    type: "decision",
    position: { x: 500, y: 40 },
    data: {
      label: "Urgency check",
      prompt: "Does the message describe a blocked account, outage, or other urgent issue?",
      status: "idle",
    },
  },
  {
    id: "sales-intent",
    type: "decision",
    position: { x: 500, y: 300 },
    data: {
      label: "Sales intent",
      prompt: "Is the person asking about pricing, a demo, or a new purchase?",
      status: "idle",
    },
  },
  {
    id: "priority-route",
    type: "decision",
    position: { x: 880, y: 20 },
    data: {
      label: "Priority route",
      prompt: "Should this request be escalated to the priority response team?",
      status: "idle",
    },
  },
  {
    id: "self-serve-route",
    type: "decision",
    position: { x: 880, y: 210 },
    data: {
      label: "Self-serve route",
      prompt: "Can this request be resolved with a help center article?",
      status: "idle",
    },
  },
  {
    id: "qualified-lead",
    type: "decision",
    position: { x: 880, y: 420 },
    data: {
      label: "Qualified lead",
      prompt: "Does this look like a qualified opportunity for the sales team?",
      status: "idle",
    },
  },
];

function workflowEdge(
  source: string,
  target: string,
  branch: "YES" | "NO",
): DecisionFlowEdge {
  return {
    id: `${source}-${branch.toLowerCase()}-${target}`,
    source,
    target,
    sourceHandle: branch,
    targetHandle: null,
    type: "smoothstep",
    label: branch,
    data: { branch },
  };
}

export const demoEdges: DecisionFlowEdge[] = [
  workflowEdge("request-type", "urgency-check", "YES"),
  workflowEdge("request-type", "sales-intent", "NO"),
  workflowEdge("urgency-check", "priority-route", "YES"),
  workflowEdge("urgency-check", "self-serve-route", "NO"),
  workflowEdge("sales-intent", "qualified-lead", "YES"),
];

export const defaultWorkflowInput =
  "Hi, I am locked out of my account and cannot access our team workspace. We have a client presentation in one hour. Can someone help?";
