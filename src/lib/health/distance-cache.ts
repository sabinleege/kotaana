/**
 * Distance cache — write synced samples into RunActivity (or a dedicated cache table).
 */

import { prisma } from "@/lib/db";

export type DistanceInput = {
  date: string; // YYYY-MM-DD
  distanceKm: number;
  durationSec?: number;
  calories?: number;
  source?: string;
  activityType?: string;
};

/**
 * Upsert daily distance samples for a user.
 * Uses RunActivity model already present in the schema.
 */
export async function cacheDistanceSamples(
  userId: string,
  samples: DistanceInput[],
): Promise<{ written: number }> {
  let written = 0;

  for (const s of samples) {
    if (!s.distanceKm || s.distanceKm <= 0) continue;
    const date = new Date(s.date);

    // Avoid exact unique constraint issues by checking existing same-day GPS/manual rows
    const existing = await prisma.runActivity.findFirst({
      where: {
        userId,
        date,
        source: s.source || "gps",
      },
    });

    if (existing) {
      await prisma.runActivity.update({
        where: { id: existing.id },
        data: {
          distanceKm: s.distanceKm,
          durationSec: s.durationSec ?? existing.durationSec,
          calories: s.calories ?? existing.calories,
        },
      });
    } else {
      await prisma.runActivity.create({
        data: {
          userId,
          date,
          activityType: s.activityType || "walk",
          distanceKm: s.distanceKm,
          durationSec: s.durationSec ?? Math.round(s.distanceKm * 600), // rough 10 min/km
          calories: s.calories ?? Math.round(s.distanceKm * 60),
          source: s.source || "gps",
        },
      });
    }
    written++;
  }

  return { written };
}

/**
 * Weekly / 3-day summary helpers for dashboards.
 */
export async function getDistanceSummary(userId: string, days = 7) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const rows = await prisma.runActivity.findMany({
    where: { userId, date: { gte: since } },
    orderBy: { date: "asc" },
  });

  const totalKm = rows.reduce((s, r) => s + Number(r.distanceKm), 0);
  const totalCalories = rows.reduce((s, r) => s + (r.calories || 0), 0);

  return {
    days,
    totalKm: Math.round(totalKm * 10) / 10,
    totalCalories,
    sessions: rows.length,
    samples: rows.map((r) => ({
      date: r.date.toISOString().slice(0, 10),
      distanceKm: r.distanceKm,
      source: r.source,
    })),
  };
}
