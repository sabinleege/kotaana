/**
 * Day boundary: when the athlete's local (or server) calendar day changes,
 * reset daily counters (water, etc.). Meals stay keyed by date (no wipe of history).
 */
import { prisma } from "@/lib/db";

export function dayKey(d = new Date(), timeZone?: string): string {
  try {
    if (timeZone) {
      return new Intl.DateTimeFormat("en-CA", {
        timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(d);
    }
  } catch {
    /* fall through */
  }
  return d.toISOString().slice(0, 10);
}

export type RolloverResult = {
  dayKey: string;
  rolled: boolean;
  waterGlasses: number;
};

/**
 * Call on every authenticated app entry (/api/me, home data).
 * If lastDayKey !== today → reset waterGlasses to 0, set lastDayKey.
 * Calories "today" already come from MealLog by date — new day = empty log until user logs.
 */
export async function ensureDayRollover(userId: string, timeZone?: string): Promise<RolloverResult> {
  const today = dayKey(new Date(), timeZone);
  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: { lastDayKey: true, waterGlasses: true },
  });

  if (!profile) {
    return { dayKey: today, rolled: false, waterGlasses: 0 };
  }

  if (profile.lastDayKey === today) {
    return {
      dayKey: today,
      rolled: false,
      waterGlasses: profile.waterGlasses ?? 0,
    };
  }

  const updated = await prisma.profile.update({
    where: { userId },
    data: {
      lastDayKey: today,
      waterGlasses: 0,
      // clear stale session only if report is from another day (session rebuild happens separately)
      ...(profile.lastDayKey && profile.lastDayKey !== today
        ? {}
        : {}),
    },
    select: { waterGlasses: true },
  });

  return {
    dayKey: today,
    rolled: true,
    waterGlasses: updated.waterGlasses ?? 0,
  };
}
