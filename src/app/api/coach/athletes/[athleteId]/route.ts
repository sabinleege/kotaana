import { requireUser } from "@/lib/authz";
import { route, json } from "@/lib/api";
import { requireCoach, assertManages } from "@/lib/coach/access";
import { permissionsFor } from "@/lib/coach/permissions";
import { prisma } from "@/lib/db";
import { getProfileReport } from "@/lib/profile-report";

export const GET = route(async (_req: Request, ctx: { params: Promise<{ athleteId: string }> }) => {
  const me = await requireUser();
  await requireCoach(me.id);
  const { athleteId } = await ctx.params;
  await assertManages(me.id, athleteId);

  // Being linked gets the coach to this athlete; the athlete's own privacy
  // settings decide how much of them is returned.
  const perms = await permissionsFor(athleteId);

  const [user, profile, injuryCount, checkin] = await Promise.all([
    prisma.user.findUnique({ where: { id: athleteId }, select: { email: true, name: true } }),
    prisma.profile.findUnique({ where: { userId: athleteId } }),
    perms.can("injuries")
      ? prisma.injury.count({ where: { athleteId, status: { not: "resolved" } } })
      : Promise.resolve(null),
    perms.can("health")
      ? prisma.dailyCheckin.findFirst({ where: { userId: athleteId }, orderBy: { date: "desc" } })
      : Promise.resolve(null),
  ]);

  // The AI profile report summarises health, nutrition and training together,
  // so withhold it unless the athlete shares all three.
  const maySeeReport =
    perms.can("health") && perms.can("nutrition") && perms.can("workout_history");
  const report = maySeeReport ? await getProfileReport(athleteId).catch(() => null) : null;

  const hidden = [
    ...(perms.can("injuries") ? [] : ["injuries"]),
    ...(perms.can("health") ? [] : ["health"]),
    ...(perms.can("weight") ? [] : ["weight"]),
    ...(perms.can("workout_history") ? [] : ["workout_history"]),
    ...(maySeeReport ? [] : ["ai_report"]),
  ];

  return json({
    athleteId,
    name: profile?.fullName || user?.name || "Athlete",
    email: profile?.email || user?.email,
    readiness: perms.can("health") ? (checkin?.readiness ?? null) : null,
    adherence: perms.can("workout_history") ? (profile?.adherencePercentage ?? null) : null,
    weight: perms.can("weight") ? (profile?.weight ?? null) : null,
    injuries: injuryCount,
    profileReport: report,
    /** Categories this athlete has chosen not to share — show as withheld, not empty. */
    hidden,
  });
});
