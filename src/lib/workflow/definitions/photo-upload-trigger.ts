/**
 * Workflow: triggered when an athlete uploads a progress photo
 */

import type { WorkflowDefinition, WorkflowContext, StepResult } from "../engine";

export const photoUploadTrigger: WorkflowDefinition = {
  id: "photo-upload-trigger",
  name: "Progress Photo Upload",
  description: "Handle new progress photo: validate, store metadata, maybe trigger comparison",
  steps: [
    {
      id: "validate-photo",
      name: "Validate photo metadata",
      run: async (ctx: WorkflowContext): Promise<StepResult> => {
        const pose = ctx.payload?.pose;
        if (!pose || !["front", "side", "back"].includes(String(pose))) {
          return { status: "failed", error: "Invalid or missing pose" };
        }
        return { status: "ok", output: { pose } };
      },
    },
    {
      id: "save-record",
      name: "Save progress photo record",
      run: async (ctx: WorkflowContext): Promise<StepResult> => {
        // Real code: prisma.progressPhoto.create(...)
        return {
          status: "ok",
          output: { photoId: `photo_${Date.now()}`, userId: ctx.userId },
        };
      },
    },
    {
      id: "check-monthly-comparison",
      name: "Check if monthly comparison should run",
      optional: true,
      run: async (ctx: WorkflowContext): Promise<StepResult> => {
        // Real code: count photos this month; if enough, start monthly-photo-comparison workflow
        return { status: "ok", output: { comparisonQueued: false } };
      },
    },
    {
      id: "invalidate-profile",
      name: "Invalidate profile report",
      optional: true,
      run: async (): Promise<StepResult> => {
        return { status: "ok" };
      },
    },
  ],
};
