"use client";

import React, { useCallback, useState, useEffect } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  type Node,
  type Edge,
  type Connection,
  type NodeChange,
  type EdgeChange,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import DecisionNode from "./DecisionNode";
import NodeEditor from "./NodeEditor";
import ExecutionPanel from "./ExecutionPanel";
import { DecisionNodeData, WorkflowJSON } from "@/types/workflow";
import {
  ExecutionStepResult,
  findStartNodeId,
  validateWorkflow,
} from "@/lib/workflow";

const nodeTypes = { decisionNode: DecisionNode };

const STORAGE_KEY = "visual-ai-workflow-state";
const HISTORY_STORAGE_KEY = "visual-ai-workflow-history";
const MAX_HISTORY_ENTRIES = 10;

let idCounter = 1;
function generateId() {
  return `node-${Date.now()}-${idCounter++}`;
}

export default function WorkflowCanvas() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [executionResults, setExecutionResults] = useState<ExecutionStepResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [history, setHistory] = useState<{ timestamp: string; results: ExecutionStepResult[] }[]>([]);
  const [hasLoaded, setHasLoaded] = useState(false);

  // Load saved state AFTER mounting (client-only), so it never runs during SSR.
  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional one-time hydration-safe load from localStorage
        setNodes(parsed.nodes || []);
        // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional one-time hydration-safe load from localStorage
        setEdges(parsed.edges || []);
      } catch {
        // ignore corrupted storage
      }
    }

    const savedHistory = window.localStorage.getItem(HISTORY_STORAGE_KEY);
    if (savedHistory) {
      try {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional one-time hydration-safe load from localStorage
        setHistory(JSON.parse(savedHistory));
      } catch {
        // ignore corrupted storage
      }
    }

    setHasLoaded(true);
  }, []);

  // Save workflow state whenever nodes/edges change (after initial load only).
  useEffect(() => {
    if (!hasLoaded) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ nodes, edges }));
  }, [nodes, edges, hasLoaded]);

  // Save execution history whenever it changes (after initial load only).
  useEffect(() => {
    if (!hasLoaded) return;
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
  }, [history, hasLoaded]);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) =>
      setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) =>
      setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const onConnect = useCallback((connection: Connection) => {
    setEdges((eds) =>
      addEdge(
        {
          ...connection,
          animated: false,
          style: {
            stroke: connection.sourceHandle === "yes" ? "#16a34a" : "#dc2626",
            strokeWidth: 2,
          },
        },
        eds
      )
    );
  }, []);

  const addNode = () => {
    const id = generateId();
    const newNode: Node = {
      id,
      type: "decisionNode",
      position: { x: 250, y: nodes.length * 150 + 50 },
      data: {
        prompt: "",
        status: "idle",
      } as DecisionNodeData,
    };
    setNodes((nds) => [...nds, newNode]);
  };

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
  }, []);

  const updatePrompt = (nodeId: string, newPrompt: string) => {
    setNodes((nds) =>
      nds.map((n) =>
        n.id === nodeId
          ? { ...n, data: { ...n.data, prompt: newPrompt } }
          : n
      )
    );
  };

  const deleteNode = (nodeId: string) => {
    setNodes((nds) => nds.filter((n) => n.id !== nodeId));
    setEdges((eds) =>
      eds.filter((e) => e.source !== nodeId && e.target !== nodeId)
    );
    setSelectedNodeId(null);
  };

  const resetNodeStatuses = () => {
    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        data: { ...n.data, status: "idle", result: undefined, error: undefined },
      }))
    );
  };

  const applyResultsToNodes = (results: ExecutionStepResult[]) => {
    setNodes((nds) =>
      nds.map((n) => {
        const stepResult = results.find((r) => r.nodeId === n.id);
        if (!stepResult) {
          return { ...n, data: { ...n.data, status: "idle" } };
        }
        return {
          ...n,
          data: {
            ...n.data,
            status: stepResult.error ? "failed" : "completed",
            result: stepResult.result,
            error: stepResult.error,
          },
        };
      })
    );
  };

  const exportWorkflow = () => {
    const workflow: WorkflowJSON = {
      nodes: nodes.map((n) => ({
        id: n.id,
        position: n.position,
        data: n.data as DecisionNodeData,
      })),
      edges: edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        sourceHandle: e.sourceHandle ?? null,
      })),
    };

    const blob = new Blob([JSON.stringify(workflow, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "workflow.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const importWorkflow = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string) as WorkflowJSON;
        const importedNodes: Node[] = parsed.nodes.map((n) => ({
          id: n.id,
          type: "decisionNode",
          position: n.position,
          data: { ...n.data, status: "idle" },
        }));
        const importedEdges: Edge[] = parsed.edges.map((e) => ({
          id: e.id,
          source: e.source,
          target: e.target,
          sourceHandle: e.sourceHandle,
          style: {
            stroke: e.sourceHandle === "yes" ? "#16a34a" : "#dc2626",
            strokeWidth: 2,
          },
        }));
        setNodes(importedNodes);
        setEdges(importedEdges);
        setExecutionResults([]);
      } catch {
        alert("Invalid workflow file. Please choose a valid exported JSON file.");
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  };

  const animateExecutedEdges = (
    results: ExecutionStepResult[],
    workflow: WorkflowJSON
  ) => {
    const executedEdgeIds = new Set<string>();
    for (let i = 0; i < results.length - 1; i++) {
      const current = results[i];
      const next = results[i + 1];
      if (!current.result) continue;
      const handle = current.result === "YES" ? "yes" : "no";
      const matchingEdge = workflow.edges.find(
        (e) =>
          e.source === current.nodeId &&
          e.target === next.nodeId &&
          e.sourceHandle === handle
      );
      if (matchingEdge) executedEdgeIds.add(matchingEdge.id);
    }

    setEdges((eds) =>
      eds.map((e) => ({
        ...e,
        animated: executedEdgeIds.has(e.id),
      }))
    );
  };

  const runWorkflow = async () => {
    const workflow: WorkflowJSON = {
      nodes: nodes.map((n) => ({
        id: n.id,
        position: n.position,
        data: n.data as DecisionNodeData,
      })),
      edges: edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        sourceHandle: e.sourceHandle ?? null,
      })),
    };

    const warnings = validateWorkflow(workflow);
    const blockingWarning = warnings.find((warning: string) =>
      warning.includes("No starting node")
    );

    if (blockingWarning) {
      alert(`Cannot run workflow:\n\n${blockingWarning}`);
      return;
    }

    if (warnings.length > 0) {
      const proceed = confirm(
        `Workflow has some issues:\n\n${warnings.join("\n")}\n\nRun anyway?`
      );
      if (!proceed) return;
    }

    setIsRunning(true);
    setExecutionResults([]);
    resetNodeStatuses();

    const startNodeId = findStartNodeId(workflow);

    if (startNodeId) {
      setNodes((nds) =>
        nds.map((n) =>
          n.id === startNodeId
            ? { ...n, data: { ...n.data, status: "running" } }
            : n
        )
      );
    }

    const triggerRes = await fetch("/api/execute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workflow }),
    });

    const { eventId } = await triggerRes.json();

    if (!eventId) {
      setIsRunning(false);
      return;
    }

    // Poll for status every 1 second, up to 30 seconds
    for (let attempt = 0; attempt < 30; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const statusRes = await fetch(
        `/api/execute/status?eventId=${eventId}`
      );
      const statusData = await statusRes.json();
      const run = statusData?.data?.[0];

      if (run?.status === "Completed") {
        const results: ExecutionStepResult[] = run.output?.results || [];

        setExecutionResults(results);
        applyResultsToNodes(results);
        animateExecutedEdges(results, workflow);

        setHistory((prev) =>
          [
            { timestamp: new Date().toISOString(), results },
            ...prev,
          ].slice(0, MAX_HISTORY_ENTRIES)
        );

        setIsRunning(false);
        return;
      }

      if (run?.status === "Failed") {
        setIsRunning(false);
        return;
      }
    }

    setIsRunning(false);
  };

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  return (
    <div className="w-full h-screen relative">
      <div className="absolute top-4 left-4 z-10 flex gap-2">
        <button
          onClick={addNode}
          className="bg-blue-600 text-white px-4 py-2 rounded shadow text-sm font-medium hover:bg-blue-700"
        >
          + Add Decision Node
        </button>

        <button
          onClick={runWorkflow}
          disabled={isRunning || nodes.length === 0}
          className="bg-green-600 text-white px-4 py-2 rounded shadow text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isRunning ? "Running..." : "▶ Execute Workflow"}
        </button>

        <button
          onClick={exportWorkflow}
          disabled={nodes.length === 0}
          className="bg-gray-600 text-white px-4 py-2 rounded shadow text-sm font-medium hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ⬇ Export JSON
        </button>

        <label className="bg-gray-600 text-white px-4 py-2 rounded shadow text-sm font-medium hover:bg-gray-700 cursor-pointer">
          ⬆ Import JSON
          <input
            type="file"
            accept="application/json"
            onChange={importWorkflow}
            className="hidden"
          />
        </label>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>

      <NodeEditor
        nodeId={selectedNodeId}
        prompt={(selectedNode?.data as DecisionNodeData)?.prompt || ""}
        onChange={updatePrompt}
        onClose={() => setSelectedNodeId(null)}
        onDelete={deleteNode}
      />

      <ExecutionPanel
        results={executionResults}
        isRunning={isRunning}
        onRetry={runWorkflow}
      />
    </div>
  );
}

