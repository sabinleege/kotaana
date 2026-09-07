/**
 * Weekly Athlete Summary — persistent memory for AI (token-saving).
 */
import { prisma } from "@/lib/db";
import { getProfileReport, invalidateProfileReport } from "@/lib/profile-report";
import { generateText } from "@/lib/ai";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export async function getWeeklySummary(userId: string): Promise<string | null> {
  const p = await prisma.profile.findUnique({
    where: { userId },
    select: { weeklySummary: true, weeklySummaryAt: true },
  });
  if (p?.weeklySummary && p.weeklySummaryAt && Date.now() - p.weeklySummaryAt.getTime() < WEEK_MS) {
    return p.weeklySummary;
  }
  return null;
}

export async function refreshWeeklySummary(userId: string): Promise<string> {
  const report = await getProfileReport(userId);
  const since = new Date(Date.now() - WEEK_MS);

  const [workouts, checkins, meals, events] = await Promise.all([
    prisma.workoutLog.findMany({ where: { userId, date: { gte: since } }, select: { completionRate: true, date: true } }),
    prisma.dailyCheckin.findMany({ where: { userId, date: { gte: since } }, select: { readiness: true, feeling: true, sleepHours: true } }),
    prisma.mealLog.count({ where: { userId, date: { gte: since } } }),
    prisma.recommendationEvent.findMany({ where: { userId, createdAt: { gte: since } }, take: 40 }).catch(() => []),
  ]);

  const adherence = workouts.length
    ? Math.round((workouts.reduce((s, w) => s + Number(w.completionRate), 0) / workouts.length) * 100)
    : null;
  const avgReady = checkins.length
    ? Math.round(checkins.reduce((s, c) => s + c.readiness, 0) / checkins.length)
    : null;
  const done = (events as any[]).filter((e) => e.action === "done").length;
  const skip = (events as any[]).filter((e) => e.action === "skip").length;

  const prompt = `Compress into a WEEKLY ATHLETE SUMMARY (max 180 words) for coaching AI. Be factual.
BASE PROFILE:
${report}

THIS WEEK STATS:
- Workouts logged: ${workouts.length}, adherence ~${adherence ?? "n/a"}%
- Check-ins: ${checkins.length}, avg readiness ${avgReady ?? "n/a"}
- Meal logs: ${meals}
- Recommendations done/skip: ${done}/${skip}

Include: goals, equipment, injuries/pregnancy constraints, consistency, recovery, nutrition pattern, recommended focus, risks.`;

  let summary: string;
  try {
    summary = await generateText(prompt, "You write compact athletic weekly summaries for AI coaches.");
  } catch {
    summary = `${report}\n\nWeekly: adherence ${adherence ?? "n/a"}%, readiness ${avgReady ?? "n/a"}, meals ${meals}, done ${done}/skip ${skip}.`;
  }

  await prisma.profile.update({
    where: { userId },
    data: { weeklySummary: summary, weeklySummaryAt: new Date() },
  }).catch(() => {});

  await invalidateProfileReport(userId);
  return summary;
}

/** Context string for any AI call: weekly if fresh, else profile report. */
export async function getAiMemoryContext(userId: string): Promise<string> {
  const weekly = await getWeeklySummary(userId);
  if (weekly) return `WEEKLY ATHLETE SUMMARY:\n${weekly}`;
  const report = await getProfileReport(userId);
  return `ATHLETE PROFILE REPORT:\n${report}`;
}
