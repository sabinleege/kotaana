import { requireUser } from "@/lib/authz";
import { route, json } from "@/lib/api";
import { requireCoach, listManagedAthleteIds } from "@/lib/coach/access";
import { prisma } from "@/lib/db";

export const GET = route(async (req: Request) => {
  const me = await requireUser();
  await requireCoach(me.id);

  const detailed = new URL(req.url).searchParams.get("detailed") === "1";
  const relations = await listManagedAthleteIds(me.id, true);
  if (!relations.length) return json({ athletes: [] });

  const ids = relations.map((r) => r.athleteId);
  const statusMap = new Map(relations.map((r) => [r.athleteId, r.status]));

  const profiles = await prisma.profile.findMany({
    where: { userId: { in: ids } },
    select: {
      userId: true,
      fullName: true,
      email: true,
      lastActiveAt: true,
      adherencePercentage: true,
    },
  });
  const users = await prisma.user.findMany({
    where: { id: { in: ids } },
    select: { id: true, email: true, name: true },
  });

  const since = new Date();
  since.setDate(since.getDate() - 7);

  const [checkins, workouts, injuryGroups] = await Promise.all([
    prisma.dailyCheckin.findMany({
      where: { userId: { in: ids }, date: { gte: since } },
      select: { userId: true, readiness: true, date: true },
    }),
    prisma.workoutLog.findMany({
      where: { userId: { in: ids }, date: { gte: since } },
      select: { userId: true, completionRate: true, date: true },
    }),
    prisma.injury.groupBy({
      by: ["athleteId"],
      where: { athleteId: { in: ids }, status: { not: "resolved" } },
      _count: true,
    }),
  ]);

  const injMap = new Map(injuryGroups.map((g) => [g.athleteId, g._count]));

  const athletes = ids.map((id) => {
    const p = profiles.find((x) => x.userId === id);
    const u = users.find((x) => x.id === id);
    const c = checkins.filter((x) => x.userId === id);
    const readiness = c.length
      ? Math.round(c.reduce((s, x) => s + x.readiness, 0) / c.length)
      : null;
    const w = workouts.filter((x) => x.userId === id);
    const adherence = w.length
      ? (w.reduce((s, x) => s + Number(x.completionRate), 0) / w.length) * 100
      : p?.adherencePercentage ?? null;
    const lastCheckin = c.sort((a, b) => b.date.getTime() - a.date.getTime())[0]?.date;
    const lastWorkout = w.sort((a, b) => b.date.getTime() - a.date.getTime())[0]?.date;
    const injuries = injMap.get(id) || 0;
    let aiFlag = "ok";
    if (injuries > 0 || (readiness != null && readiness < 50)) aiFlag = "risk";
    else if (readiness != null && readiness < 65) aiFlag = "warn";

    return {
      athleteId: id,
      name: p?.fullName || u?.name || "Athlete",
      email: p?.email || u?.email,
      status: statusMap.get(id) || "active",
      readiness,
      adherence,
      injuries,
      lastActive: p?.lastActiveAt?.toISOString() || lastCheckin?.toISOString() || null,
      ...(detailed
        ? {
            lastCheckin: lastCheckin?.toISOString() || null,
            lastWorkout: lastWorkout?.toISOString() || null,
            aiFlag,
          }
        : {}),
    };
  });

  return json({ athletes });
});
