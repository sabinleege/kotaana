/**
 * Registry of all workflow definitions
 */

import type { WorkflowDefinition } from "../engine";
import { threeDayProfileRefresh } from "./3day-profile-refresh";
import { photoUploadTrigger } from "./photo-upload-trigger";
import { medicalUpdateTrigger } from "./medical-update-trigger";
import { monthlyPhotoComparison } from "./monthly-photo-comparison";
import { coachApproval } from "./coach-approval";
import { injuryStatusChange } from "./injury-status-change";
import { subscriptionRenewal } from "./subscription-renewal";

const DEFINITIONS: Record<string, WorkflowDefinition> = {
  [threeDayProfileRefresh.id]: threeDayProfileRefresh,
  [photoUploadTrigger.id]: photoUploadTrigger,
  [medicalUpdateTrigger.id]: medicalUpdateTrigger,
  [monthlyPhotoComparison.id]: monthlyPhotoComparison,
  [coachApproval.id]: coachApproval,
  [injuryStatusChange.id]: injuryStatusChange,
  [subscriptionRenewal.id]: subscriptionRenewal,
};

export function getDefinition(id: string): WorkflowDefinition | undefined {
  return DEFINITIONS[id];
}

export function listDefinitions(): WorkflowDefinition[] {
  return Object.values(DEFINITIONS);
}

export {
  threeDayProfileRefresh,
  photoUploadTrigger,
  medicalUpdateTrigger,
  monthlyPhotoComparison,
  coachApproval,
  injuryStatusChange,
  subscriptionRenewal,
};
