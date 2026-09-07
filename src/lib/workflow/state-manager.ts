/**
 * Workflow State Manager
 * Persists workflow instances and step results.
 * Currently uses an in-memory store for scaffolding.
 * Replace with Prisma models (WorkflowInstance, WorkflowStepResult) in production.
 */

import type { WorkflowContext, StepResult } from "./engine";

export type WorkflowInstance = {
  id: string;
  definitionId: string;
  name: string;
  status: "pending" | "running" | "completed" | "failed" | "cancelled";
  context: WorkflowContext;
  currentStep: string | null;
  error?: string | null;
  stepResults: Record<string, StepResult>;
  createdAt: Date;
  updatedAt: Date;
};

const store = new Map<string, WorkflowInstance>();

function uid() {
  return `wf_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export async function createInstance(input: {
  definitionId: string;
  name: string;
  context: WorkflowContext;
  status: WorkflowInstance["status"];
}): Promise<WorkflowInstance> {
  const instance: WorkflowInstance = {
    id: uid(),
    definitionId: input.definitionId,
    name: input.name,
    status: input.status,
    context: input.context,
    currentStep: null,
    error: null,
    stepResults: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  store.set(instance.id, instance);
  return instance;
}

export async function getInstance(id: string): Promise<WorkflowInstance | null> {
  return store.get(id) ?? null;
}

export async function updateInstance(
  id: string,
  patch: Partial<Pick<WorkflowInstance, "status" | "currentStep" | "error">>,
): Promise<WorkflowInstance | null> {
  const inst = store.get(id);
  if (!inst) return null;
  Object.assign(inst, patch, { updatedAt: new Date() });
  store.set(id, inst);
  return inst;
}

export async function addStepResult(
  instanceId: string,
  stepId: string,
  result: StepResult,
): Promise<void> {
  const inst = store.get(instanceId);
  if (!inst) return;
  inst.stepResults[stepId] = result;
  inst.updatedAt = new Date();
  store.set(instanceId, inst);
}

export async function listInstances(filter?: {
  definitionId?: string;
  status?: string;
}): Promise<WorkflowInstance[]> {
  let items = Array.from(store.values());
  if (filter?.definitionId) items = items.filter((i) => i.definitionId === filter.definitionId);
  if (filter?.status) items = items.filter((i) => i.status === filter.status);
  return items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}
