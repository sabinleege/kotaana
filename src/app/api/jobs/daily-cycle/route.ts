/**
 * Cron: once per day batch — rollover is per-user on login;
 * this rebuilds daily reports + sessions for recently active users.
 * Header: x-cron-secret: CRON_SECRET
 */
import { route, json } from "@/lib/api";
import { prisma } from "@/lib/db";
import { ensureDailyReport } from "@/lib/daily/report";
import { buildDailySession } from "@/lib/daily/session-builder";
import { runDailyAnalysisForUser } from "@/lib/jobs/daily-analysis";

export const POST = route(async (req: Request) => {
  const secret = req.headers.get("x-cron-secret") || "";
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return json({ error: "Unauthorized" }, 401);
  }
  const limit = Math.min(100, Number(new URL(req.url).searchParams.get("limit") || 40));
  const since = new Date(Date.now() - 7 * 86400000);
  const users = await prisma.user.findMany({
    where: {
      role: { in: ["user", "athlete"] as any },
      OR: [
        { dailyCheckins: { some: { date: { gte: since } } } },
        { workoutLogs: { some: { date: { gte: since } } } },
        { mealLogs: { some: { date: { gte: since } } } },
      ],
    },
    select: { id: true },
    take: limit,
  });

  const out: any[] = [];
  for (const u of users) {
    try {
      const report = await ensureDailyReport(u.id);
      const session = await buildDailySession(u.id);
      await runDailyAnalysisForUser(u.id).catch(() => null);
      out.push({ userId: u.id, reportDay: report.day, blocks: session.blocks.length });
    } catch (e: any) {
      out.push({ userId: u.id, error: e.message });
    }
  }
  return json({ processed: out.length, results: out });
});
