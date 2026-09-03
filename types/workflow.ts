export type NodeStatus = "idle" | "waiting" | "running" | "completed" | "failed";

export interface DecisionNodeData {
  prompt: string;
  status: NodeStatus;
  result?: "YES" | "NO";
  error?: string;
  [key: string]: unknown;
}

export interface WorkflowJSON {
  nodes: {
    id: string;
    position: { x: number; y: number };
    data: DecisionNodeData;
  }[];
  edges: {
    id: string;
    source: string;
    target: string;
    sourceHandle: string | null;
  }[];
}