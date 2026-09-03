import type { WorkflowJSON } from "@/types/workflow";

export type ExecutionStepResult = {
  nodeId: string;
  prompt: string;
  result?: "YES" | "NO";
  error?: string;
  order: number;
};

export function findStartNodeId(
  workflow: WorkflowJSON
): string | null {
  if (workflow.nodes.length === 0) {
    return null;
  }

  const targetIds = new Set(
    workflow.edges.map((edge) => edge.target)
  );

  const startNode = workflow.nodes.find(
    (node) => !targetIds.has(node.id)
  );

  return startNode?.id ?? null;
}

export function findNextNodeId(
  workflow: WorkflowJSON,
  currentNodeId: string,
  result: "YES" | "NO"
): string | null {
  const handle = result === "YES" ? "yes" : "no";

  const edge = workflow.edges.find(
    (item) =>
      item.source === currentNodeId &&
      item.sourceHandle === handle
  );

  return edge?.target ?? null;
}

export function validateWorkflow(
  workflow: WorkflowJSON
): string[] {
  const warnings: string[] = [];

  if (workflow.nodes.length === 0) {
    warnings.push("Workflow has no nodes.");
    return warnings;
  }

  const targetIds = new Set(
    workflow.edges.map((edge) => edge.target)
  );

  const startNodes = workflow.nodes.filter(
    (node) => !targetIds.has(node.id)
  );

  if (startNodes.length === 0) {
    warnings.push(
      "No starting node found (every node has an incoming connection — check for a cycle)."
    );
  } else if (startNodes.length > 1) {
    warnings.push(
      `Multiple possible starting nodes found (${startNodes.length}). The first one will be used.`
    );
  }

  for (const node of workflow.nodes) {
    if (
      !node.data.prompt ||
      node.data.prompt.trim() === ""
    ) {
      warnings.push(
        `Node "${node.id}" has an empty prompt.`
      );
    }
  }

  const nodeIds = new Set(
    workflow.nodes.map((node) => node.id)
  );

  for (const edge of workflow.edges) {
    if (
      !nodeIds.has(edge.source) ||
      !nodeIds.has(edge.target)
    ) {
      warnings.push(
        `Edge "${edge.id}" references a node that doesn't exist.`
      );
    }
  }

  const connectedIds = new Set<string>();

  for (const edge of workflow.edges) {
    connectedIds.add(edge.source);
    connectedIds.add(edge.target);
  }

  if (workflow.nodes.length > 1) {
    const disconnectedNodes = workflow.nodes.filter(
      (node) => !connectedIds.has(node.id)
    );

    for (const node of disconnectedNodes) {
      warnings.push(
        `Node "${node.id}" is disconnected from the rest of the workflow.`
      );
    }
  }

  return warnings;
}