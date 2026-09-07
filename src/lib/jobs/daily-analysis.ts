/**
 * Daily AI analysis agent — risk + optional notification.
 */
import { prisma } from "@/lib/db";
import { computeRiskScore } from "@/lib/risk/health-risk";
import { refreshWeeklySummary } from "@/lib/memory/weekly-summary";

export async function runDailyAnalysisForUser(userId: string) {
  const scores = await computeRiskScore(userId);
  if (scores.overall < 45 || scores.overtraining === "high" || scores.flags.length >= 3) {
    await prisma.notification.create({
      data: {
        userId,
        title: "Health risk attention",
        message: `Overall ${scores.overall}/100. ${scores.flags.slice(0, 3).join(" · ") || "Review recovery and load."}`,
        type: "risk_alert",
        data: scores as any,
      },
    }).catch(() => {});
  }
  return scores;
}

/** Batch: active athletes who checked in or logged recently */
export async function runDailyAnalysisBatch(limit = 50) {
  const since = new Date(Date.now() - 3 * 86400000);
  const users = await prisma.user.findMany({
    where: { role: "user", OR: [
      { dailyCheckins: { some: { date: { gte: since } } } },
      { workoutLogs: { some: { date: { gte: since } } } },
    ] },
    select: { id: true },
    take: limit,
  });
  const results = [];
  for (const u of users) {
    try {
      results.push({ userId: u.id, scores: await runDailyAnalysisForUser(u.id) });
    } catch (e: any) {
      results.push({ userId: u.id, error: e.message });
    }
  }
  return results;
}

export async function runWeeklySummaryBatch(limit = 30) {
  const users = await prisma.user.findMany({ where: { role: "user" }, select: { id: true }, take: limit });
  for (const u of users) {
    await refreshWeeklySummary(u.id).catch(() => {});
  }
  return { processed: users.length };
}
