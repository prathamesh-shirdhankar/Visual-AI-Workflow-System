"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { DecisionNodeData } from "@/types/workflow";

const statusStyles: Record<string, string> = {
  idle: "border-gray-300 bg-white",
  waiting: "border-yellow-400 bg-yellow-50",
  running: "border-blue-500 bg-blue-50 animate-pulse",
  completed: "border-green-500 bg-green-50",
  failed: "border-red-500 bg-red-50",
};

export default function DecisionNode({ data, selected }: NodeProps) {
  const nodeData = data as unknown as DecisionNodeData;
  const status = nodeData.status || "idle";

  return (
    <div
      className={`rounded-lg border-2 p-3 w-64 shadow-sm ${statusStyles[status]} ${
        selected ? "ring-2 ring-blue-400" : ""
      }`}
    >
      <Handle type="target" position={Position.Top} />

      <div className="text-xs font-semibold text-gray-500 mb-1">
        AI Decision
      </div>
      <div className="text-sm text-gray-800 mb-3 min-h-[2.5rem]">
        {nodeData.prompt || "Click to edit prompt..."}
      </div>

      {nodeData.result && (
        <div className="text-xs mb-2 font-medium">
          Result: <span className="font-bold">{nodeData.result}</span>
        </div>
      )}

      <div className="flex justify-between text-xs font-semibold">
        <span className="text-green-600">YES</span>
        <span className="text-red-600">NO</span>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        id="yes"
        style={{ left: "25%", background: "#16a34a" }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="no"
        style={{ left: "75%", background: "#dc2626" }}
      />
    </div>
  );
}