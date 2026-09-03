"use client";

interface NodeEditorProps {
  nodeId: string | null;
  prompt: string;
  onChange: (nodeId: string, newPrompt: string) => void;
  onClose: () => void;
  onDelete: (nodeId: string) => void;
}

export default function NodeEditor({
  nodeId,
  prompt,
  onChange,
  onClose,
  onDelete,
}: NodeEditorProps) {
  if (!nodeId) return null;

  return (
    <div className="absolute top-4 right-4 w-80 bg-white border border-gray-300 rounded-lg shadow-lg p-4 z-10">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-semibold">Edit Node Prompt</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 text-sm"
        >
          ✕
        </button>
      </div>

      <textarea
        className="w-full border border-gray-300 rounded p-2 text-sm min-h-[100px]"
        value={prompt}
        onChange={(e) => onChange(nodeId, e.target.value)}
        placeholder="e.g. Is this a support request?"
      />

      <p className="text-xs text-gray-500 mt-2">
        This prompt will be sent to the AI. The AI must answer only YES or NO.
      </p>

      <button
        onClick={() => onDelete(nodeId)}
        className="mt-3 text-xs text-red-600 hover:text-red-800"
      >
        Delete this node
      </button>
    </div>
  );
}