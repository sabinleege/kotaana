/**
 * GET /api/owner/metrics — platform metrics for app owner only.
 */
import { requireRole } from "@/lib/authz";
import { route, json } from "@/lib/api";
import { prisma } from "@/lib/db";

export const GET = route(async () => {
  await requireRole("admin");

  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [
    users,
    athletes,
    coaches,
    owners,
    activeRelations,
    activeSubs,
    aiToday,
    aiMonth,
    workouts7d,
    checkins7d,
    injuriesActive,
    notifications7d,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "user" } }),
    prisma.user.count({ where: { role: "coach" } }),
    prisma.user.count({ where: { role: "admin" } }),
    prisma.coachAthleteRelation.count({ where: { status: "active" } }),
    prisma.subscription.count({ where: { status: "active" } }),
    prisma.aiUsage.count({ where: { createdAt: { gte: since24h } } }),
    prisma.aiUsage.count({ where: { createdAt: { gte: monthStart } } }),
    prisma.workoutLog.count({ where: { date: { gte: since7d } } }),
    prisma.dailyCheckin.count({ where: { date: { gte: since7d } } }),
    prisma.injury.count({ where: { status: { not: "resolved" } } }),
    prisma.notification.count({ where: { createdAt: { gte: since7d } } }),
  ]);

  const aiByFunction = await prisma.aiUsage.groupBy({
    by: ["functionName"],
    where: { createdAt: { gte: monthStart } },
    _count: true,
  }).catch(() => []);

  return json({
    users,
    athletes,
    coaches,
    owners,
    activeRelations,
    activeSubs,
    aiToday,
    aiMonth,
    workouts7d,
    checkins7d,
    injuriesActive,
    notifications7d,
    aiByFunction: (aiByFunction as any[]).map((r) => ({
      name: r.functionName,
      count: r._count,
    })),
    generatedAt: new Date().toISOString(),
  });
});
