import { requireUser } from "@/lib/authz";
import { route, json } from "@/lib/api";
import { requireCoach, listManagedAthleteIds } from "@/lib/coach/access";
import { prisma } from "@/lib/db";

export const GET = route(async () => {
  const me = await requireUser();
  await requireCoach(me.id);
  const relations = await listManagedAthleteIds(me.id, false);
  const ids = relations.map((r) => r.athleteId);
  if (!ids.length) return json({ injuries: [], illness: [] });

  const profiles = await prisma.profile.findMany({
    where: { userId: { in: ids } },
    select: { userId: true, fullName: true },
  });
  const name = (id: string) => profiles.find((p) => p.userId === id)?.fullName || "Athlete";

  const injuries = await prisma.injury.findMany({
    where: { athleteId: { in: ids }, status: { not: "resolved" } },
    orderBy: { dateReported: "desc" },
  });

  const since = new Date();
  since.setDate(since.getDate() - 14);
  const checkins = await prisma.dailyCheckin.findMany({
    where: {
      userId: { in: ids },
      date: { gte: since },
      OR: [{ feeling: "sick" }, { feeling: "off" }],
    },
    orderBy: { date: "desc" },
  });

  return json({
    injuries: injuries.map((i) => ({
      id: i.id,
      athleteId: i.athleteId,
      athleteName: name(i.athleteId),
      bodyPart: i.bodyPart,
      injuryType: i.injuryType,
      severity: i.severity,
      status: i.status,
      dateReported: i.dateReported.toISOString(),
      notes: i.notes,
    })),
    illness: checkins.map((c) => ({
      athleteId: c.userId,
      athleteName: name(c.userId),
      feeling: c.feeling,
      symptoms: c.symptoms,
      date: c.date.toISOString(),
      readiness: c.readiness,
    })),
  });
});
