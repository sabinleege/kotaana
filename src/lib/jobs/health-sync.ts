/**
 * Job: sync distance data for Track Me users
 */

import { registerJob, enqueue } from "./queue";
import { fetchGoogleDistance } from "@/lib/health/google-health";
import { cacheDistanceSamples } from "@/lib/health/distance-cache";

registerJob("health.sync", async (payload) => {
  const userId = String(payload.userId || "");
  if (!userId) throw new Error("userId required");

  const days = Number(payload.days || 7);
  // Tokens would be loaded from DB in production
  const samples = await fetchGoogleDistance({ accessToken: "stored" }, days);
  await cacheDistanceSamples(
    userId,
    samples.map((s) => ({
      date: s.date,
      distanceKm: s.distanceKm,
      source: "gps",
      activityType: "walk",
    })),
  );
});

export function scheduleHealthSync(userId: string, days = 7, delayMs = 0) {
  return enqueue("health.sync", { userId, days }, { delayMs });
}
