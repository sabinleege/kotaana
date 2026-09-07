import { prisma } from "@/lib/db";
import { cacheGet, cacheSet, cacheDel } from "@/lib/cache/simple-cache";
import { getPregnancyContext } from "@/lib/pregnancy/workflow";
import { getCoachLearningForAthlete } from "@/lib/coach/learning";

const STALE_MS = 3 * 24 * 60 * 60 * 1000;

async function build(userId: string): Promise<string> {
  const [p, injuries, checkin, workouts] = await Promise.all([
    prisma.profile.findUnique({ where: { userId } }),
    prisma.injury.findMany({
      where: { athleteId: userId, status: { not: "resolved" } },
      orderBy: { dateReported: "desc" },
    }),
    prisma.dailyCheckin.findFirst({ where: { userId }, orderBy: { date: "desc" } }),
    prisma.workoutLog.findMany({
      where: { userId },
      orderBy: { date: "desc" },
      take: 7,
      select: { completionRate: true },
    }),
  ]);
  if (!p) return "No profile yet.";

  const adherence = workouts.length
    ? Math.round((workouts.reduce((s, w) => s + Number(w.completionRate), 0) / workouts.length) * 100)
    : p.adherencePercentage ?? null;

  const conditions = Array.isArray(p.healthConditions) ? (p.healthConditions as any[]) : [];
  const preg = getPregnancyContext({ isPregnant: p.isPregnant, pregnancyDueDate: p.pregnancyDueDate });
  const parts: string[] = [];
  parts.push(`Name: ${p.fullName || "athlete"}, ${p.age ?? "?"}y ${p.gender ?? ""}`.trim());
  parts.push(
    `Body: ${p.weight ?? "?"}kg (target ${p.targetWeight ?? "?"}kg), height ${p.height ?? "?"}cm, activity ${p.activityLevel ?? "moderate"}`,
  );
  parts.push(`Goal: ${p.primaryGoal || p.goalDescription || "general fitness"}`);
  parts.push(
    `Training: ${p.trainingDaysPerWeek ?? 3} days/wk, ${p.sessionDurationMin ?? 45} min, equipment: ${(p.equipment ?? []).join(", ") || "basic"}`,
  );
  if (p.dietaryStyle?.length || p.allergies?.length)
    parts.push(
      `Diet: ${(p.dietaryStyle ?? []).join(", ") || "no restriction"}${p.allergies?.length ? `; allergies: ${p.allergies.join(", ")}` : ""}`,
    );
  if (preg.isPregnant) {
    parts.push(
      `PREGNANT trimester ${preg.trimester ?? "?"} (~${preg.weeksApprox ?? "?"}w) — prenatal-safe only.`,
    );
  }
  if (conditions.length)
    parts.push(`Conditions: ${conditions.map((c) => `${c.type}${c.medications ? ` (${c.medications})` : ""}`).join("; ")}`);
  parts.push(
    `Injuries: ${
      injuries.length
        ? injuries
            .map(
              (i) =>
                `${i.bodyPart}/${i.injuryType} sev${i.severity} ${i.status}${i.restrictions ? ` [${i.restrictions}]` : ""}`,
            )
            .join("; ")
        : "none"
    }`,
  );
  if (checkin)
    parts.push(
      `Latest readiness: ${checkin.readiness}/100 (feeling "${checkin.feeling}"${checkin.symptoms ? `, ${checkin.symptoms}` : ""})`,
    );
  if (adherence != null) parts.push(`Recent adherence: ${adherence}%`);
  if (p.nutritionAdherence != null) parts.push(`Nutrition adherence: ${p.nutritionAdherence}%`);
  if (p.riskScoreJson && typeof p.riskScoreJson === "object") {
    const r = p.riskScoreJson as any;
    parts.push(`Risk overall: ${r.overall ?? "?"}, recovery ${r.recovery ?? "?"}, overtraining ${r.overtraining ?? "?"}`);
  }
  const coachLearn = await getCoachLearningForAthlete(userId);
  if (coachLearn) parts.push(coachLearn);

  return parts.join("\n");
}

export async function getProfileReport(userId: string): Promise<string> {
  const cacheKey = `profile-report:${userId}`;
  const cached = cacheGet<string>(cacheKey);
  if (cached) return cached;

  const p = await prisma.profile.findUnique({
    where: { userId },
    select: { aiReport: true, aiReportAt: true },
  });
  const fresh = p?.aiReport && p.aiReportAt && Date.now() - p.aiReportAt.getTime() < STALE_MS;
  if (fresh) {
    cacheSet(cacheKey, p!.aiReport!, 120);
    return p!.aiReport!;
  }

  const report = await build(userId);
  await prisma.profile
    .update({ where: { userId }, data: { aiReport: report, aiReportAt: new Date() } })
    .catch(() => {});
  cacheSet(cacheKey, report, 120);
  return report;
}

export async function invalidateProfileReport(userId: string): Promise<void> {
  cacheDel(`profile-report:${userId}`);
  await prisma.profile.update({ where: { userId }, data: { aiReportAt: null } }).catch(() => {});
}
