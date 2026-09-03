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
import { DecisionNodeData } from "@/types/workflow";

const nodeTypes = { decisionNode: DecisionNode };

const STORAGE_KEY = "visual-ai-workflow-state";

let idCounter = 1;
function generateId() {
  return `node-${Date.now()}-${idCounter++}`;
}

export default function WorkflowCanvas() {
  // Start empty on both server and client render, so the first HTML
  // the server sends matches what the client renders before hydration.
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
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
    setHasLoaded(true);
  }, []);

  // Save state whenever nodes/edges change (but not before the initial load finishes,
  // or we'd overwrite saved data with the empty initial state).
  useEffect(() => {
    if (!hasLoaded) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ nodes, edges }));
  }, [nodes, edges, hasLoaded]);

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
    </div>
  );
}