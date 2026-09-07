/**
 * Cron: once per day batch — rollover is per-user on login;
 * this rebuilds daily reports + sessions for recently active users.
 *
 * Auth: `x-cron-secret: <CRON_SECRET>` or `Authorization: Bearer <CRON_SECRET>`.
 * GET exists because Vercel Cron issues GET.
 */
import { route, json } from "@/lib/api";
import { assertCron } from "@/lib/cron";
import { prisma } from "@/lib/db";
import { ensureDailyReport } from "@/lib/daily/report";
import { buildDailySession } from "@/lib/daily/session-builder";
import { runDailyAnalysisForUser } from "@/lib/jobs/daily-analysis";

async function runCycle(req: Request) {
  assertCron(req);

  const limit = Math.min(100, Number(new URL(req.url).searchParams.get("limit") || 40));
  const since = new Date(Date.now() - 7 * 86400000);
  const users = await prisma.user.findMany({
    where: {
      role: "user",
      OR: [
        { dailyCheckins: { some: { date: { gte: since } } } },
        { workoutLogs: { some: { date: { gte: since } } } },
        { mealLogs: { some: { date: { gte: since } } } },
      ],
    },
    select: { id: true },
    take: limit,
  });

  const out: { userId: string; reportDay?: unknown; blocks?: number; error?: string }[] = [];
  for (const u of users) {
    try {
      const report = await ensureDailyReport(u.id);
      const session = await buildDailySession(u.id);
      await runDailyAnalysisForUser(u.id).catch(() => null);
      out.push({ userId: u.id, reportDay: report.day, blocks: session.blocks.length });
    } catch (e) {
      out.push({ userId: u.id, error: e instanceof Error ? e.message : "failed" });
    }
  }
  return json({ processed: out.length, results: out });
}

export const POST = route(runCycle);
export const GET = route(runCycle);
