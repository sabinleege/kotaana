/**
 * Lightweight scheduler placeholders.
 * In production replace with Inngest, BullMQ, or pg_cron.
 */

import { startWorkflow } from "./engine";
import { subscribe } from "./event-bus";

/** Example: run 3-day profile refresh for a user */
export async function scheduleProfileRefresh(userId: string) {
  return startWorkflow("3day-profile-refresh", { userId, athleteId: userId });
}

/** Example: react to photo upload event */
export function registerDefaultHandlers() {
  subscribe("photo.uploaded", async (payload) => {
    await startWorkflow("photo-upload-trigger", {
      userId: String(payload.userId || ""),
      payload,
    });
  });

  subscribe("medical.updated", async (payload) => {
    await startWorkflow("medical-update-trigger", {
      userId: String(payload.userId || ""),
      athleteId: String(payload.athleteId || payload.userId || ""),
      payload,
    });
  });

  subscribe("injury.status_changed", async (payload) => {
    await startWorkflow("injury-status-change", {
      userId: String(payload.userId || ""),
      payload,
    });
  });
}

/** Call once at app startup if desired */
export function initWorkflowScheduler() {
  registerDefaultHandlers();
  console.log("[workflow] scheduler handlers registered");
}
