/**
 * Job: refresh 3-day profile report for a user
 */

import { registerJob, enqueue } from "./queue";
import { startWorkflow } from "@/lib/workflow/engine";

registerJob("profile-report.refresh", async (payload) => {
  const userId = String(payload.userId || "");
  if (!userId) throw new Error("userId required");

  // Prefer workflow so history is recorded
  await startWorkflow("3day-profile-refresh", {
    userId,
    athleteId: userId,
  });
});

export function scheduleProfileReportRefresh(userId: string, delayMs = 0) {
  return enqueue("profile-report.refresh", { userId }, { delayMs });
}
