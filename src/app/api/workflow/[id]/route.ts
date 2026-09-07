/**
 * GET /api/workflow/:id — status of a workflow instance
 */

import { requireUser } from "@/lib/authz";
import { route, json } from "@/lib/api";
import { getWorkflowStatus } from "@/lib/workflow/engine";
import { getHistory } from "@/lib/workflow/history";

export const GET = route(async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
  await requireUser();
  const { id } = await ctx.params;

  const instance = await getWorkflowStatus(id);
  if (!instance) return json({ error: "Not found" }, 404);

  const history = await getHistory(id);

  return json({
    id: instance.id,
    definitionId: instance.definitionId,
    name: instance.name,
    status: instance.status,
    currentStep: instance.currentStep,
    error: instance.error,
    stepResults: instance.stepResults,
    createdAt: instance.createdAt,
    updatedAt: instance.updatedAt,
    history,
  });
});
