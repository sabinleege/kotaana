/**
 * AI Health Risk Engine — deterministic scores + optional narrative.
 */
import { prisma } from "@/lib/db";

export type RiskScores = {
  recovery: number; // 0-100 higher better
  overtraining: "low" | "medium" | "high";
  nutrition: "poor" | "ok" | "good" | "excellent";
  sleep: "poor" | "ok" | "good" | "excellent";
  hydration: "poor" | "ok" | "good" | "excellent";
  overall: number; // 0-100
  flags: string[];
};

function band(n: number): "poor" | "ok" | "good" | "excellent" {
  if (n >= 85) return "excellent";
  if (n >= 70) return "good";
  if (n >= 50) return "ok";
  return "poor";
}

export async function computeRiskScore(userId: string): Promise<RiskScores> {
  const since = new Date(Date.now() - 7 * 86400000);
  const [profile, injuries, checkins, workouts, meals] = await Promise.all([
    prisma.profile.findUnique({ where: { userId } }),
    prisma.injury.findMany({ where: { athleteId: userId, status: { not: "resolved" } } }),
    prisma.dailyCheckin.findMany({ where: { userId, date: { gte: since } } }),
    prisma.workoutLog.findMany({ where: { userId, date: { gte: since } }, select: { completionRate: true } }),
    prisma.mealLog.count({ where: { userId, date: { gte: since } } }),
  ]);

  const flags: string[] = [];
  let recovery = profile?.recoveryScore ?? 70;
  if (checkins.length) {
    recovery = Math.round(checkins.reduce((s, c) => s + c.readiness, 0) / checkins.length);
  }
  if (injuries.length) {
    recovery = Math.max(20, recovery - injuries.length * 8);
    flags.push(`${injuries.length} active injur${injuries.length > 1 ? "ies" : "y"}`);
  }
  if (profile?.isPregnant) flags.push("Pregnancy — prenatal-safe guidance only");

  const adherence = workouts.length
    ? workouts.reduce((s, w) => s + Number(w.completionRate), 0) / workouts.length
    : 0.5;
  let overtraining: RiskScores["overtraining"] = "low";
  if (adherence > 0.95 && recovery < 55) {
    overtraining = "high";
    flags.push("High load + low recovery");
  } else if (adherence > 0.85 && recovery < 65) overtraining = "medium";

  const mealScore = Math.min(100, (meals / 7) * 100);
  const nutrition = band(mealScore);
  if (mealScore < 50) flags.push("Sparse meal logging");

  const sleepHours = checkins.filter((c) => c.sleepHours != null).map((c) => c.sleepHours!);
  const avgSleep = sleepHours.length ? sleepHours.reduce((a, b) => a + b, 0) / sleepHours.length : 7;
  const sleepScore = Math.max(0, Math.min(100, 100 - Math.abs(avgSleep - 7.5) * 15));
  const sleep = band(sleepScore);
  if (sleep === "poor") flags.push("Sleep below target");

  const water = profile?.waterGlasses ?? 0;
  const waterTarget = profile?.waterTarget ?? 8;
  const hydraScore = waterTarget ? Math.min(100, (water / waterTarget) * 100) : 70;
  const hydration = band(hydraScore);

  const overall = Math.round(
    recovery * 0.35 +
      (overtraining === "low" ? 90 : overtraining === "medium" ? 60 : 35) * 0.2 +
      mealScore * 0.15 +
      sleepScore * 0.15 +
      hydraScore * 0.15,
  );

  const scores: RiskScores = {
    recovery: Math.round(recovery),
    overtraining,
    nutrition,
    sleep,
    hydration,
    overall,
    flags,
  };

  await prisma.profile.update({
    where: { userId },
    data: { riskScoreJson: scores as any },
  }).catch(() => {});

  return scores;
}
