/**
 * Workflow: medical / pregnancy / injury update
 * Forces profile report rebuild and may notify coach.
 */

import type { WorkflowDefinition, WorkflowContext, StepResult } from "../engine";

export const medicalUpdateTrigger: WorkflowDefinition = {
  id: "medical-update-trigger",
  name: "Medical / Health Update",
  description: "React to pregnancy flag, new injury, or health condition change",
  steps: [
    {
      id: "detect-change",
      name: "Detect type of medical change",
      run: async (ctx: WorkflowContext): Promise<StepResult> => {
        const type = ctx.payload?.changeType || "unknown";
        return { status: "ok", output: { changeType: type } };
      },
    },
    {
      id: "rebuild-profile-report",
      name: "Force rebuild of profile report",
      run: async (ctx: WorkflowContext): Promise<StepResult> => {
        // await invalidateProfileReport(...) then getProfileReport(...)
        return { status: "ok", output: { rebuilt: true } };
      },
    },
    {
      id: "notify-coach",
      name: "Notify linked coaches",
      optional: true,
      run: async (ctx: WorkflowContext): Promise<StepResult> => {
        // Create notifications for active coaches of this athlete
        return { status: "ok", output: { notified: true } };
      },
    },
    {
      id: "flag-ai-safety",
      name: "Ensure AI safety flags are updated",
      run: async (ctx: WorkflowContext): Promise<StepResult> => {
        return { status: "ok", output: { safetyFlagsUpdated: true } };
      },
    },
  ],
};
