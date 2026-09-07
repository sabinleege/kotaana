/**
 * Track Me — enable/disable distance tracking and store preference on profile.
 */

import { prisma } from "@/lib/db";

export type TrackMeStatus = {
  enabled: boolean;
  provider: "none" | "google_health" | "health_connect" | "manual";
  lastSyncAt: string | null;
};

/**
 * Read Track Me preference.
 * For now we store a simple flag in Profile via a JSON field or dedicated columns later.
 * Using healthConditions-style extensibility: we read/write a lightweight meta key.
 */
export async function getTrackMeStatus(userId: string): Promise<TrackMeStatus> {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: { aiReport: true }, // temporary placeholder storage; replace with dedicated fields
  });

  // Until schema has trackMeEnabled / trackMeProvider columns, return safe defaults
  return {
    enabled: false,
    provider: "none",
    lastSyncAt: null,
  };
}

export async function setTrackMeEnabled(
  userId: string,
  enabled: boolean,
  provider: TrackMeStatus["provider"] = "manual",
): Promise<TrackMeStatus> {
  // Real implementation: prisma.profile.update({ data: { trackMeEnabled: enabled, trackMeProvider: provider } })
  // For scaffold we just acknowledge the request.
  return {
    enabled,
    provider: enabled ? provider : "none",
    lastSyncAt: enabled ? new Date().toISOString() : null,
  };
}
