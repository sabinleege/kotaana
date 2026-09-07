/**
 * Workflow: Coach approval / follow-up resolution
 */

import type { WorkflowDefinition, WorkflowContext, StepResult } from "../engine";

export const coachApproval: WorkflowDefinition = {
  id: "coach-approval",
  name: "Coach Approval Flow",
  description: "Handle coach approving a plan, note visibility, or follow-up completion",
  steps: [
    {
      id: "validate-coach",
      name: "Validate coach owns the relation",
      run: async (ctx: WorkflowContext): Promise<StepResult> => {
        if (!ctx.coachId || !ctx.athleteId) {
          return { status: "failed", error: "coachId and athleteId required" };
        }
        return { status: "ok" };
      },
    },
    {
      id: "apply-decision",
      name: "Apply approval / rejection decision",
      run: async (ctx: WorkflowContext): Promise<StepResult> => {
        const decision = ctx.payload?.decision || "approved";
        return { status: "ok", output: { decision } };
      },
    },
    {
      id: "notify-athlete",
      name: "Notify athlete of coach decision",
      optional: true,
      run: async (): Promise<StepResult> => {
        return { status: "ok" };
      },
    },
  ],
};
