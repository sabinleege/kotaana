/**
 * Workflow: Injury status changed (active → recovering → resolved)
 */

import type { WorkflowDefinition, WorkflowContext, StepResult } from "../engine";

export const injuryStatusChange: WorkflowDefinition = {
  id: "injury-status-change",
  name: "Injury Status Change",
  description: "React when an injury status is updated",
  steps: [
    {
      id: "load-injury",
      name: "Load injury record",
      run: async (ctx: WorkflowContext): Promise<StepResult> => {
        if (!ctx.payload?.injuryId) {
          return { status: "failed", error: "injuryId required" };
        }
        return { status: "ok", output: { injuryId: ctx.payload.injuryId } };
      },
    },
    {
      id: "update-profile-flags",
      name: "Update athlete safety flags",
      run: async (): Promise<StepResult> => {
        return { status: "ok" };
      },
    },
    {
      id: "rebuild-report",
      name: "Rebuild profile report",
      run: async (): Promise<StepResult> => {
        return { status: "ok" };
      },
    },
    {
      id: "notify-coach",
      name: "Notify coach if linked",
      optional: true,
      run: async (): Promise<StepResult> => {
        return { status: "ok" };
      },
    },
  ],
};
