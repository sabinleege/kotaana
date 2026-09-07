/**
 * Workflow Engine — core runner
 * Executes workflow definitions step by step, persists state, handles retries.
 */

import { getDefinition } from "./definitions";
import { createInstance, getInstance, updateInstance, addStepResult } from "./state-manager";
import { publish } from "./event-bus";
import { withRetry } from "./retry";
import { recordHistory } from "./history";

export type WorkflowContext = {
  userId?: string;
  athleteId?: string;
  coachId?: string;
  payload?: Record<string, unknown>;
  [key: string]: unknown;
};

export type StepResult = {
  status: "ok" | "failed" | "skipped";
  output?: unknown;
  error?: string;
};

export type WorkflowStep = {
  id: string;
  name: string;
  run: (ctx: WorkflowContext) => Promise<StepResult>;
  optional?: boolean;
};

export type WorkflowDefinition = {
  id: string;
  name: string;
  description?: string;
  steps: WorkflowStep[];
};

export async function startWorkflow(
  definitionId: string,
  context: WorkflowContext,
): Promise<{ instanceId: string }> {
  const def = getDefinition(definitionId);
  if (!def) throw new Error(`Unknown workflow: ${definitionId}`);

  const instance = await createInstance({
    definitionId: def.id,
    name: def.name,
    context,
    status: "running",
  });

  await recordHistory(instance.id, "started", { definitionId });
  await publish("workflow.started", { instanceId: instance.id, definitionId });

  // Run asynchronously so the API can return immediately
  runWorkflow(instance.id, def, context).catch(async (err) => {
    await updateInstance(instance.id, {
      status: "failed",
      error: err instanceof Error ? err.message : String(err),
    });
    await recordHistory(instance.id, "failed", { error: String(err) });
    await publish("workflow.failed", { instanceId: instance.id, error: String(err) });
  });

  return { instanceId: instance.id };
}

async function runWorkflow(
  instanceId: string,
  def: WorkflowDefinition,
  context: WorkflowContext,
) {
  for (const step of def.steps) {
    await updateInstance(instanceId, { currentStep: step.id });
    await recordHistory(instanceId, "step_started", { stepId: step.id, name: step.name });

    try {
      const result = await withRetry(() => step.run(context), {
        retries: step.optional ? 1 : 3,
        delayMs: 500,
      });

      await addStepResult(instanceId, step.id, result);
      await recordHistory(instanceId, "step_finished", {
        stepId: step.id,
        status: result.status,
      });

      if (result.status === "failed" && !step.optional) {
        await updateInstance(instanceId, {
          status: "failed",
          error: result.error || `Step ${step.id} failed`,
        });
        await publish("workflow.failed", { instanceId, stepId: step.id });
        return;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await addStepResult(instanceId, step.id, { status: "failed", error: message });
      await recordHistory(instanceId, "step_failed", { stepId: step.id, error: message });

      if (!step.optional) {
        await updateInstance(instanceId, { status: "failed", error: message });
        await publish("workflow.failed", { instanceId, stepId: step.id, error: message });
        return;
      }
    }
  }

  await updateInstance(instanceId, { status: "completed", currentStep: null });
  await recordHistory(instanceId, "completed", {});
  await publish("workflow.completed", { instanceId, definitionId: def.id });
}

export async function getWorkflowStatus(instanceId: string) {
  return getInstance(instanceId);
}
