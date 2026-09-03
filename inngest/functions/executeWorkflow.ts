import { eventType, staticSchema } from "inngest";
import { inngest } from "@/inngest/client";
import { askYesNo } from "@/lib/ai";
import {
  findStartNodeId,
  findNextNodeId,
  type ExecutionStepResult,
} from "@/lib/workflow";
import type { WorkflowJSON } from "@/types/workflow";

type WorkflowExecuteEvent = {
  workflow: WorkflowJSON;
};

const workflowExecute = eventType("workflow/execute", {
  schema: staticSchema<WorkflowExecuteEvent>(),
});

export const executeWorkflow = inngest.createFunction(
  {
    id: "execute-workflow",
    triggers: [workflowExecute],
  },
  async ({ event, step }) => {
    const workflow = event.data.workflow;

    const results: ExecutionStepResult[] = [];

    let currentNodeId = findStartNodeId(workflow);
    let order = 0;

    while (currentNodeId) {
      const node = workflow.nodes.find(
        (item) => item.id === currentNodeId
      );

      if (!node) {
        results.push({
          nodeId: currentNodeId,
          prompt: "",
          error: `Node "${currentNodeId}" was not found.`,
          order,
        });

        break;
      }

      try {
        const result = await step.run(
          `execute-node-${node.id}`,
          async () => {
            return await askYesNo(node.data.prompt);
          }
        );

        results.push({
          nodeId: node.id,
          prompt: node.data.prompt,
          result,
          order,
        });

        currentNodeId = findNextNodeId(
          workflow,
          node.id,
          result
        );

        order++;
      } catch (error) {
        results.push({
          nodeId: node.id,
          prompt: node.data.prompt,
          error:
            error instanceof Error
              ? error.message
              : "Unknown execution error.",
          order,
        });

        break;
      }
    }

    return { results };
  }
);