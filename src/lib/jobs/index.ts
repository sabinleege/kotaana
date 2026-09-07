/**
 * Jobs module — import this once at app startup to register all handlers.
 */

import { initJobSystem, enqueue, listJobs, getJob, registerJob } from "./queue";
import "./profile-report";
import "./photo-comparison";
import "./health-sync";
import "./credit-reset";
import "./notification-dispatcher";

export { enqueue, listJobs, getJob, registerJob, initJobSystem };
export { scheduleProfileReportRefresh } from "./profile-report";
export { schedulePhotoComparison } from "./photo-comparison";
export { scheduleHealthSync } from "./health-sync";
export { scheduleCreditReset } from "./credit-reset";
export { scheduleNotification } from "./notification-dispatcher";

// Auto-init when module is imported
initJobSystem();
export * from "./daily-analysis";
