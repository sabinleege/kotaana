import { requireUser } from "@/lib/authz";
import { route, json } from "@/lib/api";
import { requireCoach, assertManages } from "@/lib/coach/access";
import { prisma } from "@/lib/db";
import { getProfileReport } from "@/lib/profile-report";

export const GET = route(async (_req: Request, ctx: { params: Promise<{ athleteId: string }> }) => {
  const me = await requireUser();
  await requireCoach(me.id);
  const { athleteId } = await ctx.params;
  await assertManages(me.id, athleteId);

  const [user, profile, injuryCount, checkin] = await Promise.all([
    prisma.user.findUnique({ where: { id: athleteId }, select: { email: true, name: true } }),
    prisma.profile.findUnique({ where: { userId: athleteId } }),
    prisma.injury.count({ where: { athleteId, status: { not: "resolved" } } }),
    prisma.dailyCheckin.findFirst({
      where: { userId: athleteId },
      orderBy: { date: "desc" },
    }),
  ]);

  const report = await getProfileReport(athleteId).catch(() => null);

  return json({
    athleteId,
    name: profile?.fullName || user?.name || "Athlete",
    email: profile?.email || user?.email,
    readiness: checkin?.readiness ?? null,
    adherence: profile?.adherencePercentage ?? null,
    injuries: injuryCount,
    profileReport: report,
  });
});
