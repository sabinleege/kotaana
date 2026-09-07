/**
 * Workflow: 3-day Profile Report refresh
 * Triggered on a schedule or after significant profile/health changes.
 */

import type { WorkflowDefinition, WorkflowContext, StepResult } from "../engine";

export const threeDayProfileRefresh: WorkflowDefinition = {
  id: "3day-profile-refresh",
  name: "3-Day Profile Report Refresh",
  description: "Rebuild the compact AI profile report for an athlete",
  steps: [
    {
      id: "load-athlete",
      name: "Load athlete profile",
      run: async (ctx: WorkflowContext): Promise<StepResult> => {
        if (!ctx.athleteId && !ctx.userId) {
          return { status: "failed", error: "athleteId or userId required" };
        }
        return { status: "ok", output: { userId: ctx.athleteId || ctx.userId } };
      },
    },
    {
      id: "invalidate-cache",
      name: "Invalidate cached report",
      run: async (ctx: WorkflowContext): Promise<StepResult> => {
        // In real code: await invalidateProfileReport(ctx.athleteId || ctx.userId!)
        return { status: "ok", output: { invalidated: true } };
      },
    },
    {
      id: "rebuild-report",
      name: "Rebuild profile report",
      run: async (ctx: WorkflowContext): Promise<StepResult> => {
        // In real code: const report = await getProfileReport(userId)
        return {
          status: "ok",
          output: { reportBuiltAt: new Date().toISOString() },
        };
      },
    },
    {
      id: "notify-ai-layer",
      name: "Notify AI layer that report is fresh",
      optional: true,
      run: async (): Promise<StepResult> => {
        return { status: "ok" };
      },
    },
  ],
};
