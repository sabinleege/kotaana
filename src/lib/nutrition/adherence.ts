/**
 * Nutrition adherence + daily budget helpers.
 */
import { prisma } from "@/lib/db";
import { macroTargets } from "@/lib/metrics";

export async function nutritionWeekStats(userId: string) {
  const since = new Date(Date.now() - 7 * 86400000);
  const profile = await prisma.profile.findUnique({ where: { userId } });
  const logs = await prisma.mealLog.findMany({
    where: { userId, date: { gte: since } },
    orderBy: { date: "desc" },
  });
  const calorieTarget = profile?.dailyCaloriesTarget || 2150;
  const proteinTarget = macroTargets(calorieTarget).protein;
  const daysLogged = logs.length;
  const proteinHits = logs.filter((l) => (l.totalProtein || 0) >= proteinTarget * 0.8).length;
  const calorieNear = logs.filter((l) => {
    const c = l.totalCalories || 0;
    return c >= calorieTarget * 0.75 && c <= calorieTarget * 1.15;
  }).length;
  const adherence = Math.round(
    ((daysLogged / 7) * 0.5 + (proteinHits / Math.max(1, daysLogged)) * 0.3 + (calorieNear / Math.max(1, daysLogged)) * 0.2) * 100,
  );

  await prisma.profile.update({
    where: { userId },
    data: { nutritionAdherence: adherence },
  }).catch(() => {});

  return {
    daysLogged,
    calorieTarget,
    proteinTarget,
    proteinHits,
    adherence,
    logs: logs.map((l) => ({
      date: l.date,
      calories: l.totalCalories,
      protein: l.totalProtein,
    })),
  };
}
