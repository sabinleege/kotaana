/**
 * Workflow: Subscription renewal / credit reset
 */

import type { WorkflowDefinition, WorkflowContext, StepResult } from "../engine";

export const subscriptionRenewal: WorkflowDefinition = {
  id: "subscription-renewal",
  name: "Subscription Renewal",
  description: "Handle plan renewal, credit top-up, or expiry",
  steps: [
    {
      id: "load-subscription",
      name: "Load current subscription",
      run: async (ctx: WorkflowContext): Promise<StepResult> => {
        if (!ctx.userId) return { status: "failed", error: "userId required" };
        return { status: "ok", output: { userId: ctx.userId } };
      },
    },
    {
      id: "apply-plan",
      name: "Apply plan status / credits",
      run: async (ctx: WorkflowContext): Promise<StepResult> => {
        const action = ctx.payload?.action || "renew";
        return { status: "ok", output: { action } };
      },
    },
    {
      id: "reset-ai-credits",
      name: "Reset or top-up AI credits",
      optional: true,
      run: async (): Promise<StepResult> => {
        return { status: "ok" };
      },
    },
    {
      id: "notify-user",
      name: "Notify user of subscription change",
      optional: true,
      run: async (): Promise<StepResult> => {
        return { status: "ok" };
      },
    },
  ],
};
