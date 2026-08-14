"use client";

import "@xyflow/react/dist/style.css";

import {
  Background,
  BackgroundVariant,
  Controls,
  MarkerType,
  MiniMap,
  ReactFlow,
  addEdge,
  useEdgesState,
  useNodesState,
  type Connection,
} from "@xyflow/react";
import {
  Bot,
  Check,
  ChevronRight,
  CircleAlert,
  Clock3,
  Download,
  FileJson,
  GitBranch,
  History,
  LoaderCircle,
  Play,
  Plus,
  Redo2,
  Save,
  Sparkles,
  Trash2,
  Upload,
  X,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { DecisionNode } from "@/components/decision-node";
import { Button } from "@/components/ui/button";
import {
  defaultWorkflowInput,
  demoEdges,
  demoNodes,
} from "@/lib/demo-workflow";
import type {
  BranchValue,
  DecisionFlowEdge,
  DecisionFlowNode,
  WorkflowDefinition,
  WorkflowRunRecord,
} from "@/lib/workflow-types";

const GRAPH_STORAGE_KEY = "branchline.workflow.v1";
const HISTORY_STORAGE_KEY = "branchline.history.v1";
const nodeTypes = { decision: DecisionNode };

type SavedGraph = {
  version: 1;
  name: string;
  input?: string;
  nodes: DecisionFlowNode[];
  edges: DecisionFlowEdge[];
};

function cleanNode(node: DecisionFlowNode): DecisionFlowNode {
  return {
    id: node.id,
    type: "decision",
    position: node.position,
    data: {
      label: node.data.label,
      prompt: node.data.prompt,
      status: "idle",
    },
  };
}

function cleanEdge(edge: DecisionFlowEdge): DecisionFlowEdge {
  const branch = (edge.data?.branch ?? edge.sourceHandle ?? "YES") as BranchValue;
  return {
    id: edge.id,
    source: edge.source,
    target: edge.target,
    sourceHandle: branch,
    type: "smoothstep",
    label: branch,
    data: { branch },
  };
}

function toWorkflowDefinition(
  name: string,
  nodes: DecisionFlowNode[],
  edges: DecisionFlowEdge[],
): WorkflowDefinition {
  const startNode = nodes.find(
    (node) => !edges.some((edge) => edge.target === node.id),
  );

  return {
    name,
    startNodeId: startNode?.id ?? nodes[0]?.id ?? "",
    nodes: nodes.map((node) => ({
      id: node.id,
      type: "decision",
      position: node.position,
      data: { label: node.data.label, prompt: node.data.prompt },
    })),
    edges: edges.map((edge) => {
      const branch = (edge.data?.branch ?? edge.sourceHandle ?? "YES") as BranchValue;
      return {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        sourceHandle: branch,
        data: { branch },
      };
    }),
  };
}

function formatClock(value: string) {
  return new Intl.DateTimeFormat("en", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(value));
}

export function WorkflowStudio() {
  const [nodes, setNodes, onNodesChange] = useNodesState<DecisionFlowNode>(demoNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<DecisionFlowEdge>(demoEdges);
  const [workflowName, setWorkflowName] = useState("Customer request router");
  const [workflowInput, setWorkflowInput] = useState(defaultWorkflowInput);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>("request-type");
  const [execution, setExecution] = useState<WorkflowRunRecord | null>(null);
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [history, setHistory] = useState<WorkflowRunRecord[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [runError, setRunError] = useState<string | null>(null);
  const importRef = useRef<HTMLInputElement>(null);

  const selectedNode = nodes.find((node) => node.id === selectedNodeId) ?? null;
  const isRunning = execution?.status === "queued" || execution?.status === "running";

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      try {
        const rawGraph = localStorage.getItem(GRAPH_STORAGE_KEY);
        if (rawGraph) {
          const saved = JSON.parse(rawGraph) as SavedGraph;
          if (Array.isArray(saved.nodes) && Array.isArray(saved.edges)) {
            setNodes(saved.nodes.map(cleanNode));
            setEdges(saved.edges.map(cleanEdge));
            setWorkflowName(saved.name || "Untitled workflow");
            if (saved.input) setWorkflowInput(saved.input);
            setSelectedNodeId(saved.nodes[0]?.id ?? null);
          }
        }

        const rawHistory = localStorage.getItem(HISTORY_STORAGE_KEY);
        if (rawHistory) setHistory(JSON.parse(rawHistory) as WorkflowRunRecord[]);
      } catch {
        localStorage.removeItem(GRAPH_STORAGE_KEY);
      } finally {
        setHydrated(true);
      }
    });

    return () => window.cancelAnimationFrame(frame);
  }, [setEdges, setNodes]);

  useEffect(() => {
    if (!hydrated) return;
    const timer = window.setTimeout(() => {
      const graph: SavedGraph = {
        version: 1,
        name: workflowName,
        input: workflowInput,
        nodes: nodes.map(cleanNode),
        edges: edges.map(cleanEdge),
      };
      localStorage.setItem(GRAPH_STORAGE_KEY, JSON.stringify(graph));
    }, 350);
    return () => window.clearTimeout(timer);
  }, [edges, hydrated, nodes, workflowInput, workflowName]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 2200);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const applyExecutionState = useCallback(
    (record: WorkflowRunRecord) => {
      const decisionByNode = new Map(record.decisions.map((decision) => [decision.nodeId, decision]));
      setNodes((current) =>
        current.map((node) => {
          const decision = decisionByNode.get(node.id);
          const status =
            record.activeNodeId === node.id
              ? "active"
              : decision
                ? "complete"
                : record.status === "failed" && record.activeNodeId === node.id
                  ? "failed"
                  : "idle";
          return {
            ...node,
            data: {
              ...node.data,
              status,
              result: decision?.result,
              order: decision?.order,
            },
          };
        }),
      );
      setEdges((current) =>
        current.map((edge) => {
          const traversed = record.decisions.some((decision) => decision.edgeId === edge.id);
          const active = record.activeEdgeId === edge.id;
          const branch = edge.data?.branch ?? "YES";
          return {
            ...edge,
            animated: active,
            style: traversed || active
              ? {
                  stroke: branch === "YES" ? "#1f8a70" : "#d15a4a",
                  strokeWidth: active ? 3 : 2.4,
                }
              : undefined,
          };
        }),
      );
    },
    [setEdges, setNodes],
  );

  useEffect(() => {
    if (!activeRunId) return;
    let stopped = false;

    const poll = async () => {
      try {
        const response = await fetch(`/api/workflow/status?runId=${activeRunId}`, {
          cache: "no-store",
        });
        if (!response.ok) return;
        const record = (await response.json()) as WorkflowRunRecord;
        if (stopped) return;
        setExecution(record);
        applyExecutionState(record);

        if (record.status === "completed" || record.status === "failed") {
          setActiveRunId(null);
          setHistory((current) => {
            if (current.some((item) => item.runId === record.runId)) return current;
            const next = [record, ...current].slice(0, 8);
            localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(next));
            return next;
          });
        }
      } catch {
        if (!stopped) setRunError("The execution status could not be refreshed.");
      }
    };

    void poll();
    const interval = window.setInterval(poll, 600);
    return () => {
      stopped = true;
      window.clearInterval(interval);
    };
  }, [activeRunId, applyExecutionState]);

  const onConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target || connection.source === connection.target) return;
      const branch: BranchValue = connection.sourceHandle === "NO" ? "NO" : "YES";
      setEdges((current) => {
        const withoutExistingBranch = current.filter(
          (edge) => !(edge.source === connection.source && edge.data?.branch === branch),
        );
        return addEdge(
          {
            ...connection,
            id: `${connection.source}-${branch.toLowerCase()}-${connection.target}`,
            sourceHandle: branch,
            type: "smoothstep",
            label: branch,
            data: { branch },
            markerEnd: { type: MarkerType.ArrowClosed },
          },
          withoutExistingBranch,
        );
      });
    },
    [setEdges],
  );

  const addDecisionNode = useCallback(() => {
    const count = nodes.length + 1;
    const id = `decision-${Date.now()}`;
    const node: DecisionFlowNode = {
      id,
      type: "decision",
      position: {
        x: 180 + ((count * 90) % 520),
        y: 120 + ((count * 75) % 360),
      },
      data: {
        label: `Decision ${count}`,
        prompt: "Does the workflow input meet this condition?",
        status: "idle",
      },
    };
    setNodes((current) => [...current, node]);
    setSelectedNodeId(id);
    setNotice("Decision node added");
  }, [nodes.length, setNodes]);

  const updateSelectedNode = (patch: Partial<DecisionFlowNode["data"]>) => {
    if (!selectedNodeId) return;
    setNodes((current) =>
      current.map((node) =>
        node.id === selectedNodeId
          ? { ...node, data: { ...node.data, ...patch } }
          : node,
      ),
    );
  };

  const deleteSelectedNode = () => {
    if (!selectedNodeId) return;
    setNodes((current) => current.filter((node) => node.id !== selectedNodeId));
    setEdges((current) =>
      current.filter(
        (edge) => edge.source !== selectedNodeId && edge.target !== selectedNodeId,
      ),
    );
    setSelectedNodeId(null);
    setNotice("Node removed");
  };

  const resetExecutionStyles = () => {
    setNodes((current) =>
      current.map((node) => ({
        ...node,
        data: { ...node.data, status: "idle", result: undefined, order: undefined },
      })),
    );
    setEdges((current) =>
      current.map((edge) => ({ ...edge, animated: false, style: undefined })),
    );
  };

  const runWorkflow = async () => {
    if (isRunning || !nodes.length) return;
    setRunError(null);
    setExecution(null);
    resetExecutionStyles();

    const workflow = toWorkflowDefinition(workflowName, nodes, edges);
    const incomingStartCount = edges.filter((edge) => edge.target === workflow.startNodeId).length;
    if (!workflow.startNodeId || incomingStartCount > 0) {
      setRunError("Choose a graph with at least one entry node that has no incoming connection.");
      return;
    }

    try {
      const response = await fetch("/api/workflow/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workflow, input: workflowInput }),
      });
      const result = (await response.json()) as { runId?: string; error?: string };
      if (!response.ok || !result.runId) {
        throw new Error(result.error || "The workflow could not be queued.");
      }
      setActiveRunId(result.runId);
      setExecution({
        runId: result.runId,
        status: "queued",
        startedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        decisions: [],
        logs: [],
      });
    } catch (error) {
      setRunError(error instanceof Error ? error.message : "The workflow could not be started.");
    }
  };

  const saveNow = () => {
    const graph: SavedGraph = {
      version: 1,
      name: workflowName,
      input: workflowInput,
      nodes: nodes.map(cleanNode),
      edges: edges.map(cleanEdge),
    };
    localStorage.setItem(GRAPH_STORAGE_KEY, JSON.stringify(graph));
    setNotice("Workflow saved locally");
  };

  const exportGraph = () => {
    const graph: SavedGraph = {
      version: 1,
      name: workflowName,
      input: workflowInput,
      nodes: nodes.map(cleanNode),
      edges: edges.map(cleanEdge),
    };
    const blob = new Blob([JSON.stringify(graph, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${workflowName.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "workflow"}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setNotice("Workflow JSON exported");
  };

  const importGraph = async (file: File | undefined) => {
    if (!file) return;
    try {
      const graph = JSON.parse(await file.text()) as SavedGraph;
      if (!Array.isArray(graph.nodes) || !Array.isArray(graph.edges) || !graph.nodes.length) {
        throw new Error("This file does not contain a valid workflow.");
      }
      const nodeIds = new Set(graph.nodes.map((node) => node.id));
      if (graph.edges.some((edge) => !nodeIds.has(edge.source) || !nodeIds.has(edge.target))) {
        throw new Error("One or more connections point to missing nodes.");
      }
      setNodes(graph.nodes.map(cleanNode));
      setEdges(graph.edges.map(cleanEdge));
      setWorkflowName(graph.name || "Imported workflow");
      if (graph.input) setWorkflowInput(graph.input);
      setSelectedNodeId(graph.nodes[0]?.id ?? null);
      setExecution(null);
      setNotice("Workflow imported");
    } catch (error) {
      setRunError(error instanceof Error ? error.message : "The workflow file could not be imported.");
    } finally {
      if (importRef.current) importRef.current.value = "";
    }
  };

  const executionSummary = useMemo(() => {
    if (!execution) return "Ready to run";
    if (execution.status === "queued") return "Queued in Inngest";
    if (execution.status === "running") return `Running step ${execution.decisions.length + 1}`;
    if (execution.status === "completed") return `Completed · ${execution.decisions.length} decisions`;
    return "Run failed";
  }, [execution]);

  return (
    <main className="studio-shell">
      <header className="topbar">
        <div className="brand-lockup">
          <span className="brand-mark" aria-hidden="true"><GitBranch size={18} /></span>
          <div>
            <span className="brand-name">BRANCHLINE</span>
            <span className="brand-tag">AI WORKFLOWS</span>
          </div>
        </div>

        <div className="workflow-title-wrap">
          <input
            className="workflow-title"
            value={workflowName}
            onChange={(event) => setWorkflowName(event.target.value)}
            aria-label="Workflow name"
          />
          <span className="autosave-state"><Check size={12} /> Saved locally</span>
        </div>

        <div className="topbar-actions">
          <input
            ref={importRef}
            className="sr-only"
            type="file"
            accept="application/json,.json"
            onChange={(event) => void importGraph(event.target.files?.[0])}
          />
          <Button variant="ghost" size="sm" onClick={() => importRef.current?.click()}>
            <Upload size={14} /> Import
          </Button>
          <Button variant="ghost" size="sm" onClick={exportGraph}>
            <Download size={14} /> Export
          </Button>
          <Button
            className="run-button"
            size="sm"
            onClick={() => void runWorkflow()}
            disabled={isRunning || !nodes.length}
          >
            {isRunning ? <LoaderCircle size={14} className="spin" /> : <Play size={14} fill="currentColor" />}
            {isRunning ? "Running" : "Run flow"}
          </Button>
        </div>
      </header>

      <div className="studio-grid">
        <aside className="left-panel panel-surface">
          <section className="panel-section">
            <div className="eyebrow"><Sparkles size={13} /> Build</div>
            <h1>Turn judgment into a path.</h1>
            <p className="section-copy">Connect binary AI decisions. Every answer chooses the next branch.</p>
            <Button className="add-node-button" variant="outline" onClick={addDecisionNode}>
              <Plus size={16} /> Add decision node
            </Button>
          </section>

          <section className="panel-section input-section">
            <label htmlFor="workflow-input">
              <span className="eyebrow"><FileJson size={13} /> Test input</span>
              <span className="field-hint">Passed to every decision</span>
            </label>
            <textarea
              id="workflow-input"
              value={workflowInput}
              onChange={(event) => setWorkflowInput(event.target.value)}
              placeholder="Paste the content your workflow should classify…"
            />
            <span className="character-count">{workflowInput.length} characters</span>
          </section>

          <section className="panel-section branch-key">
            <span className="eyebrow">Connection key</span>
            <div><span className="key-dot key-dot--yes" /> YES path <ChevronRight size={13} /></div>
            <div><span className="key-dot key-dot--no" /> NO path <ChevronRight size={13} /></div>
            <p>Drag from a colored output port to any node.</p>
          </section>

          <div className="left-panel__footer">
            <Button variant="ghost" size="sm" onClick={saveNow}><Save size={14} /> Save now</Button>
            <span>{nodes.length} nodes · {edges.length} paths</span>
          </div>
        </aside>

        <section className="flow-stage" aria-label="Workflow canvas">
          <div className="canvas-caption">
            <span className={isRunning ? "status-pulse is-live" : "status-pulse"} />
            {executionSummary}
          </div>
          <ReactFlow<DecisionFlowNode, DecisionFlowEdge>
            nodes={nodes}
            edges={edges.map((edge) => ({
              ...edge,
              markerEnd: edge.markerEnd ?? { type: MarkerType.ArrowClosed },
              className: `workflow-edge workflow-edge--${(edge.data?.branch ?? "YES").toLowerCase()}`,
            }))}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={(_, node) => setSelectedNodeId(node.id)}
            onPaneClick={() => setSelectedNodeId(null)}
            onNodesDelete={(deleted) => {
              if (deleted.some((node) => node.id === selectedNodeId)) setSelectedNodeId(null);
            }}
            fitView
            fitViewOptions={{ padding: 0.22, maxZoom: 1.05 }}
            minZoom={0.35}
            maxZoom={1.8}
            defaultEdgeOptions={{ type: "smoothstep" }}
            proOptions={{ hideAttribution: true }}
            deleteKeyCode={["Backspace", "Delete"]}
          >
            <Background variant={BackgroundVariant.Dots} gap={22} size={1.2} color="#d8d3c7" />
            <Controls showInteractive={false} />
            <MiniMap
              pannable
              zoomable
              nodeColor={(node) => {
                const status = (node.data as DecisionFlowNode["data"]).status;
                if (status === "active") return "#e6a23b";
                if (status === "complete") return "#1f8a70";
                return "#cbc4b6";
              }}
              maskColor="rgba(247, 245, 239, 0.72)"
            />
          </ReactFlow>
        </section>

        <aside className="right-panel panel-surface">
          <section className="inspector panel-section">
            <div className="section-heading">
              <div>
                <span className="eyebrow"><Zap size={13} /> Inspector</span>
                <h2>{selectedNode ? "Decision details" : "Nothing selected"}</h2>
              </div>
              {selectedNode ? (
                <Button variant="ghost" size="icon" onClick={deleteSelectedNode} aria-label="Delete node">
                  <Trash2 size={15} />
                </Button>
              ) : null}
            </div>

            {selectedNode ? (
              <div className="inspector-fields">
                <label>
                  <span>Node label</span>
                  <input
                    value={selectedNode.data.label}
                    onChange={(event) => updateSelectedNode({ label: event.target.value })}
                  />
                </label>
                <label>
                  <span>Decision prompt</span>
                  <textarea
                    value={selectedNode.data.prompt}
                    onChange={(event) => updateSelectedNode({ prompt: event.target.value })}
                  />
                </label>
                <div className="binary-rule">
                  <Bot size={16} />
                  <div><strong>Binary output enforced</strong><span>The AI response is accepted only when it is exactly YES or NO.</span></div>
                </div>
              </div>
            ) : (
              <div className="empty-state"><GitBranch size={24} /><p>Select a node on the canvas to edit its label and prompt.</p></div>
            )}
          </section>

          <section className="execution-panel panel-section">
            <div className="section-heading">
              <div>
                <span className="eyebrow"><Clock3 size={13} /> Execution</span>
                <h2>Live trace</h2>
              </div>
              {execution ? <span className={`run-status run-status--${execution.status}`}>{execution.status}</span> : null}
            </div>

            {runError ? (
              <div className="error-card">
                <CircleAlert size={16} />
                <div><strong>Run could not continue</strong><span>{runError}</span></div>
                <Button size="sm" variant="outline" onClick={() => void runWorkflow()}>
                  <Redo2 size={13} /> Retry
                </Button>
              </div>
            ) : execution?.logs.length ? (
              <ol className="execution-log">
                {execution.logs.map((item, index) => (
                  <li key={item.id} className={`log-item log-item--${item.level}`}>
                    <span className="log-rail">
                      {item.level === "success" ? <Check size={11} /> : item.level === "error" ? <X size={11} /> : <span>{index + 1}</span>}
                    </span>
                    <div><p>{item.message}</p><time>{formatClock(item.timestamp)}</time></div>
                  </li>
                ))}
              </ol>
            ) : (
              <div className="empty-state empty-state--compact">
                <Play size={20} />
                <p>Run the flow to watch each decision and branch appear here.</p>
              </div>
            )}
          </section>

          <section className="history-panel panel-section">
            <div className="section-heading">
              <div>
                <span className="eyebrow"><History size={13} /> History</span>
                <h2>Recent runs</h2>
              </div>
            </div>
            {history.length ? (
              <div className="history-list">
                {history.slice(0, 3).map((item) => (
                  <button key={item.runId} onClick={() => { setExecution(item); applyExecutionState(item); }}>
                    <span className={`history-icon history-icon--${item.status}`}>
                      {item.status === "completed" ? <Check size={12} /> : <X size={12} />}
                    </span>
                    <span><strong>{item.decisions.length} decisions</strong><small>{formatClock(item.startedAt)}</small></span>
                    <ChevronRight size={14} />
                  </button>
                ))}
              </div>
            ) : <p className="history-empty">Completed runs are saved on this device.</p>}
          </section>
        </aside>
      </div>

      <footer className="statusbar">
        <span><span className="health-dot" /> Inngest-ready</span>
        <span><Bot size={12} /> OpenAI + deterministic demo mode</span>
        <span>Autosaved on this device</span>
      </footer>

      {notice ? <div className="toast"><Check size={14} /> {notice}</div> : null}
    </main>
  );
}
