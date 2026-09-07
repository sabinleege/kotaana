/**
 * Job: monthly progress photo comparison
 */

import { registerJob, enqueue } from "./queue";
import { startWorkflow } from "@/lib/workflow/engine";

registerJob("photo.comparison", async (payload) => {
  const userId = String(payload.userId || "");
  if (!userId) throw new Error("userId required");

  await startWorkflow("monthly-photo-comparison", {
    userId,
    athleteId: userId,
    payload,
  });
});

export function schedulePhotoComparison(userId: string, delayMs = 0) {
  return enqueue("photo.comparison", { userId }, { delayMs });
}
