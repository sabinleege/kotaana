/**
 * Once-per-day athlete report: profile + today's/yesterday meals + check-in + injuries.
 * Used as the single source for the daily session card algorithm.
 */
import { prisma } from "@/lib/db";
import { dayKey } from "@/lib/day/rollover";
import { getProfileReport } from "@/lib/profile-report";

export async function buildDailyReportText(userId: string, forDay?: string): Promise<string> {
  const day = forDay || dayKey();
  const prev = dayKey(new Date(Date.now() - 86400000));

  const [base, mealsToday, mealsPrev, checkin, session, runsToday] = await Promise.all([
    getProfileReport(userId),
    prisma.mealLog.findUnique({
      where: { userId_date: { userId, date: new Date(day) } },
    }),
    prisma.mealLog.findUnique({
      where: { userId_date: { userId, date: new Date(prev) } },
    }),
    prisma.dailyCheckin.findFirst({
      where: { userId, date: new Date(day) },
    }),
    prisma.profile.findUnique({
      where: { userId },
      select: { waterGlasses: true, waterTarget: true, dailyCaloriesTarget: true, track: true, ageBand: true, level: true, primaryGoal: true },
    }),
    prisma.runActivity.findMany({
      where: { userId, date: new Date(day) },
      select: { activityType: true, distanceKm: true, durationSec: true, calories: true },
    }).catch(() => []),
  ]);

  const lines: string[] = [
    `DAILY REPORT for ${day}`,
    base,
    `Water so far: ${session?.waterGlasses ?? 0}/${session?.waterTarget ?? 8}`,
    `Calorie target: ${session?.dailyCaloriesTarget ?? 2150}`,
    `Track: ${session?.track || "general"} · Age band: ${session?.ageBand || "adult"} · Level: ${session?.level || "beginner"}`,
    `Goal: ${session?.primaryGoal || "—"}`,
  ];

  if (mealsToday) {
    lines.push(
      `Meals ${day}: ${mealsToday.totalCalories ?? 0} kcal, protein ${mealsToday.totalProtein ?? 0}g`,
    );
  } else {
    lines.push(`Meals ${day}: none logged yet (calories show 0 until log)`);
  }
  if (mealsPrev) {
    lines.push(
      `Meals ${prev}: ${mealsPrev.totalCalories ?? 0} kcal, protein ${mealsPrev.totalProtein ?? 0}g`,
    );
  }
  const runKm = (runsToday || []).reduce((s: number, r: any) => s + Number(r.distanceKm || 0), 0);
  if (runKm > 0) {
    lines.push(`GPS activity ${day}: ${runKm.toFixed(2)} km across ${(runsToday || []).length} session(s)`);
  }
  if (checkin) {
    lines.push(
      `Check-in ${day}: energy/mood/soreness present — use for load management`,
    );
  }

  return lines.join("\n");
}

/** Build once per calendar day; reuse cache if same day */
export async function ensureDailyReport(userId: string): Promise<{ day: string; text: string; rebuilt: boolean }> {
  const day = dayKey();
  const p = await prisma.profile.findUnique({
    where: { userId },
    select: { dailyReportDate: true, dailyReportText: true },
  });
  if (p?.dailyReportDate === day && p.dailyReportText) {
    return { day, text: p.dailyReportText, rebuilt: false };
  }
  const text = await buildDailyReportText(userId, day);
  await prisma.profile.update({
    where: { userId },
    data: { dailyReportDate: day, dailyReportText: text },
  });
  return { day, text, rebuilt: true };
}
