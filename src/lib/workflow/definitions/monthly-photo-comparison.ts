/**
 * Workflow: Monthly progress photo comparison
 */

import type { WorkflowDefinition, WorkflowContext, StepResult } from "../engine";

export const monthlyPhotoComparison: WorkflowDefinition = {
  id: "monthly-photo-comparison",
  name: "Monthly Photo Comparison",
  description: "Compare front/side/back photos across months using AI vision",
  steps: [
    {
      id: "collect-photos",
      name: "Collect latest and previous month photos",
      run: async (ctx: WorkflowContext): Promise<StepResult> => {
        // Real: query ProgressPhoto for user, group by month/pose
        return {
          status: "ok",
          output: { pairs: 0, message: "Photo collection placeholder" },
        };
      },
    },
    {
      id: "run-ai-comparison",
      name: "Run AI vision comparison",
      run: async (ctx: WorkflowContext): Promise<StepResult> => {
        // Real: call generateJsonFromImage with before/after photos
        return {
          status: "ok",
          output: {
            summary: "Comparison not yet run — wire to photo-compare AI route",
          },
        };
      },
    },
    {
      id: "store-result",
      name: "Store comparison result",
      run: async (): Promise<StepResult> => {
        return { status: "ok" };
      },
    },
    {
      id: "notify-athlete",
      name: "Notify athlete of new comparison",
      optional: true,
      run: async (): Promise<StepResult> => {
        return { status: "ok" };
      },
    },
  ],
};
