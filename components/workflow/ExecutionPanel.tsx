"use client";

import type { ExecutionStepResult } from "@/lib/workflow";

interface ExecutionPanelProps {
  results?: ExecutionStepResult[];
  isRunning?: boolean;
  onRetry?: () => void;
}

export default function ExecutionPanel({
  results = [],
  isRunning = false,
  onRetry,
}: ExecutionPanelProps) {
  const hasResults = results.length > 0;
  const hasFailure = results.some((result) => Boolean(result.error));

  // Don't display anything when there is no execution to show.
  if (!hasResults && !isRunning) {
    return null;
  }

  return (
    <div className="absolute bottom-4 left-4 z-20 w-96 max-h-80 overflow-y-auto rounded-lg border border-gray-300 bg-white p-4 shadow-lg">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold">
          Execution Log
        </h3>

        {hasFailure && !isRunning && onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="rounded bg-orange-500 px-2 py-1 text-xs text-white hover:bg-orange-600"
          >
            Retry
          </button>
        )}
      </div>

      {isRunning && !hasResults && (
        <p className="text-xs text-gray-500">
          Starting execution...
        </p>
      )}

      {hasResults && (
        <ol className="space-y-2">
          {results.map((result) => (
            <li
              key={`${result.nodeId}-${result.order}`}
              className="border-b pb-2 text-xs"
            >
              <div className="font-medium">
                {result.order + 1}. Node:{" "}
                {result.prompt || "(empty prompt)"}
              </div>

              {result.result && (
                <div
                  className={
                    result.result === "YES"
                      ? "text-green-600"
                      : "text-red-600"
                  }
                >
                  Result: {result.result}
                </div>
              )}

              {result.error && (
                <div className="text-red-600">
                  Error: {result.error}
                </div>
              )}
            </li>
          ))}
        </ol>
      )}

      {isRunning && (
        <p className="mt-2 text-xs text-gray-400">
          Running...
        </p>
      )}
    </div>
  );
}