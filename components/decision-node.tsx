"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Bot, Check, LoaderCircle, X } from "lucide-react";

import { cn } from "@/lib/utils";
import type { DecisionFlowNode } from "@/lib/workflow-types";

export function DecisionNode({ data, selected, isConnectable }: NodeProps<DecisionFlowNode>) {
  const status = data.status ?? "idle";

  return (
    <div
      className={cn(
        "decision-node",
        selected && "is-selected",
        status === "active" && "is-active",
        status === "complete" && "is-complete",
        status === "failed" && "is-failed",
      )}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="decision-target"
        isConnectable={isConnectable}
      />

      <div className="decision-node__header">
        <span className="decision-node__icon" aria-hidden="true">
          {status === "active" ? (
            <LoaderCircle size={15} className="spin" />
          ) : status === "complete" && data.result === "YES" ? (
            <Check size={15} />
          ) : status === "complete" && data.result === "NO" ? (
            <X size={15} />
          ) : (
            <Bot size={15} />
          )}
        </span>
        <span>AI DECISION</span>
        {data.order ? <span className="decision-node__step">STEP {data.order}</span> : null}
      </div>

      <div className="decision-node__body">
        <strong>{data.label}</strong>
        <p>{data.prompt}</p>
      </div>

      <div className="decision-node__branches">
        <div className="branch-port branch-port--yes">
          <span>YES</span>
          <Handle
            id="YES"
            type="source"
            position={Position.Right}
            className="branch-handle branch-handle--yes"
            isConnectable={isConnectable}
          />
        </div>
        <div className="branch-port branch-port--no">
          <span>NO</span>
          <Handle
            id="NO"
            type="source"
            position={Position.Right}
            className="branch-handle branch-handle--no"
            isConnectable={isConnectable}
          />
        </div>
      </div>
    </div>
  );
}
