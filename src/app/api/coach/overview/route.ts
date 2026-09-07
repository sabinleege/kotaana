import { requireUser } from "@/lib/authz";
import { route, json } from "@/lib/api";
import { requireCoach, listManagedAthleteIds } from "@/lib/coach/access";
import { prisma } from "@/lib/db";
import { buildRecommendations } from "@/lib/coach/recommendations";

export const GET = route(async () => {
  const me = await requireUser();
  await requireCoach(me.id);

  const relations = await listManagedAthleteIds(me.id, false);
  const athleteIds = relations.map((r) => r.athleteId);

  if (!athleteIds.length) {
    return json({
      athletes: 0,
      followUps: 0,
      injuries: 0,
      lowReadiness: 0,
      adherenceAvg: null,
      atRisk: [],
    });
  }

  const since = new Date();
  since.setDate(since.getDate() - 7);

  const [followUps, injuries, checkins, workouts, profiles] = await Promise.all([
    prisma.followUp.count({
      where: { coachId: me.id, status: "pending", athleteId: { in: athleteIds } },
    }),
    prisma.injury.count({
      where: { athleteId: { in: athleteIds }, status: { not: "resolved" } },
    }),
    prisma.dailyCheckin.findMany({
      where: { userId: { in: athleteIds }, date: { gte: since } },
      select: { userId: true, readiness: true, feeling: true, symptoms: true, date: true },
    }),
    prisma.workoutLog.findMany({
      where: { userId: { in: athleteIds }, date: { gte: since } },
      select: { userId: true, completionRate: true },
    }),
    prisma.profile.findMany({
      where: { userId: { in: athleteIds } },
      select: { userId: true, fullName: true, isPregnant: true },
    }),
  ]);

  const nameById = new Map(profiles.map((p) => [p.userId, p.fullName || "Athlete"]));
  const signals = athleteIds.map((id) => {
    const c = checkins.filter((x) => x.userId === id);
    const readinessAvg = c.length
      ? c.reduce((s, x) => s + x.readiness, 0) / c.length
      : null;
    const last = c.sort((a, b) => b.date.getTime() - a.date.getTime())[0];
    const w = workouts.filter((x) => x.userId === id);
    const adherencePct = w.length
      ? (w.reduce((s, x) => s + Number(x.completionRate), 0) / w.length) * 100
      : null;
    return {
      athleteId: id,
      name: nameById.get(id) || "Athlete",
      readinessAvg,
      lastFeeling: last?.feeling,
      symptoms: last?.symptoms,
      adherencePct,
      activeInjuries: 0,
      isPregnant: profiles.find((p) => p.userId === id)?.isPregnant,
    };
  });

  // attach injury counts
  const injuryRows = await prisma.injury.groupBy({
    by: ["athleteId"],
    where: { athleteId: { in: athleteIds }, status: { not: "resolved" } },
    _count: true,
  });
  const injMap = new Map(injuryRows.map((r) => [r.athleteId, r._count]));
  for (const s of signals) s.activeInjuries = injMap.get(s.athleteId) || 0;

  const recs = buildRecommendations(signals);
  const lowReadiness = signals.filter((s) => s.readinessAvg != null && s.readinessAvg < 55).length;
  const adherenceVals = signals.map((s) => s.adherencePct).filter((x): x is number => x != null);
  const adherenceAvg = adherenceVals.length
    ? adherenceVals.reduce((a, b) => a + b, 0) / adherenceVals.length
    : null;

  return json({
    athletes: athleteIds.length,
    followUps,
    injuries,
    lowReadiness,
    adherenceAvg,
    atRisk: recs.slice(0, 8).map((r) => ({
      athleteId: r.athleteId,
      name: r.name,
      issues: r.issues,
      priority: r.priority,
    })),
  });
});
