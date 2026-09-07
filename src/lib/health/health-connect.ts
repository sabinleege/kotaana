/**
 * Health Connect (Android) scaffold.
 * On mobile this is usually handled by a native module or Capacitor/React Native bridge.
 * Web app receives synced summaries via our /api/health/sync endpoint.
 */

export type HealthConnectSummary = {
  date: string;
  distanceKm: number;
  steps?: number;
  activeMinutes?: number;
  source: "health_connect";
};

/**
 * Validate and normalise a batch of Health Connect records sent from the client/app.
 */
export function normaliseHealthConnectBatch(
  records: Array<{
    date: string;
    distanceMeters?: number;
    distanceKm?: number;
    steps?: number;
    activeMinutes?: number;
  }>,
): HealthConnectSummary[] {
  return records
    .filter((r) => r.date)
    .map((r) => ({
      date: r.date.slice(0, 10),
      distanceKm:
        r.distanceKm ??
        (typeof r.distanceMeters === "number" ? r.distanceMeters / 1000 : 0),
      steps: r.steps,
      activeMinutes: r.activeMinutes,
      source: "health_connect" as const,
    }))
    .filter((r) => r.distanceKm > 0 || (r.steps && r.steps > 0));
}
