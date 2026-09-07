import { requireUser } from "@/lib/authz";
import { route, json } from "@/lib/api";
import { requireCoach, listManagedAthleteIds } from "@/lib/coach/access";
import { prisma } from "@/lib/db";
import { buildRecommendations } from "@/lib/coach/recommendations";

export const GET = route(async () => {
  const me = await requireUser();
  await requireCoach(me.id);

  const relations = await listManagedAthleteIds(me.id, false);
  const ids = relations.map((r) => r.athleteId);
  if (!ids.length) return json({ recommendations: [] });

  const since = new Date();
  since.setDate(since.getDate() - 7);
  const now = Date.now();

  const [profiles, checkins, workouts, meals, injuries] = await Promise.all([
    prisma.profile.findMany({
      where: { userId: { in: ids } },
      select: { userId: true, fullName: true, isPregnant: true, healthConditions: true },
    }),
    prisma.dailyCheckin.findMany({
      where: { userId: { in: ids } },
      orderBy: { date: "desc" },
    }),
    prisma.workoutLog.findMany({
      where: { userId: { in: ids }, date: { gte: since } },
      select: { userId: true, completionRate: true, date: true },
    }),
    prisma.mealLog.findMany({
      where: { userId: { in: ids } },
      orderBy: { date: "desc" },
      distinct: ["userId"],
      select: { userId: true, date: true },
    }),
    prisma.injury.groupBy({
      by: ["athleteId"],
      where: { athleteId: { in: ids }, status: { not: "resolved" } },
      _count: true,
    }),
  ]);

  const injMap = new Map(injuries.map((i) => [i.athleteId, i._count]));
  const mealMap = new Map(meals.map((m) => [m.userId, m.date]));

  const signals = ids.map((id) => {
    const p = profiles.find((x) => x.userId === id);
    const cAll = checkins.filter((x) => x.userId === id);
    const cWeek = cAll.filter((x) => x.date >= since);
    const readinessAvg = cWeek.length
      ? cWeek.reduce((s, x) => s + x.readiness, 0) / cWeek.length
      : null;
    const last = cAll[0];
    const w = workouts.filter((x) => x.userId === id);
    const adherencePct = w.length
      ? (w.reduce((s, x) => s + Number(x.completionRate), 0) / w.length) * 100
      : null;
    const lastMeal = mealMap.get(id);
    const lastWorkout = w.sort((a, b) => b.date.getTime() - a.date.getTime())[0]?.date;
    const days = (d?: Date | null) =>
      d ? Math.floor((now - d.getTime()) / 86400000) : null;

    const conditions = Array.isArray(p?.healthConditions) ? (p!.healthConditions as any[]) : [];

    return {
      athleteId: id,
      name: p?.fullName || "Athlete",
      readinessAvg,
      lastFeeling: last?.feeling,
      symptoms: last?.symptoms,
      adherencePct,
      activeInjuries: injMap.get(id) || 0,
      daysSinceLastCheckin: days(last?.date),
      daysSinceLastWorkout: days(lastWorkout),
      daysSinceLastMealLog: days(lastMeal),
      isPregnant: p?.isPregnant,
      healthConditionsCount: conditions.length,
    };
  });

  return json({ recommendations: buildRecommendations(signals) });
});
