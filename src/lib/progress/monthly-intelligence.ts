/**
 * Monthly progress intelligence — structured comparison.
 */
import { prisma } from "@/lib/db";
import { generateText } from "@/lib/ai";
import { getAiMemoryContext } from "@/lib/memory/weekly-summary";

export async function buildMonthlyProgress(userId: string, monthKey?: string) {
  const now = new Date();
  const key = monthKey || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const [y, m] = key.split("-").map(Number);
  const start = new Date(y, m - 1, 1);
  const end = new Date(y, m, 1);

  const [weights, photos, workouts, memory] = await Promise.all([
    prisma.weightHistory.findMany({ where: { userId }, orderBy: { recordedAt: "asc" } }),
    prisma.progressPhoto.findMany({
      where: { userId, date: { gte: start, lt: end } },
      orderBy: { date: "asc" },
    }),
    prisma.workoutLog.findMany({ where: { userId, date: { gte: start, lt: end } } }),
    getAiMemoryContext(userId),
  ]);

  const wInMonth = weights.filter((w) => w.recordedAt >= start && w.recordedAt < end);
  const firstW = wInMonth[0]?.weight ?? weights[0]?.weight;
  const lastW = wInMonth[wInMonth.length - 1]?.weight ?? weights[weights.length - 1]?.weight;
  const delta = firstW != null && lastW != null ? Number(lastW) - Number(firstW) : null;
  const adherence = workouts.length
    ? Math.round((workouts.reduce((s, w) => s + Number(w.completionRate), 0) / workouts.length) * 100)
    : null;

  const metrics = {
    monthKey: key,
    weightStart: firstW ?? null,
    weightEnd: lastW ?? null,
    weightDeltaKg: delta,
    photosCount: photos.length,
    workoutsCount: workouts.length,
    adherence,
  };

  let summary: string;
  try {
    summary = await generateText(
      `${memory}\n\nMonthly metrics: ${JSON.stringify(metrics)}. Write a concise monthly progress summary (posture/fat/muscle only as estimates if photos exist: ${photos.length}). Max 120 words.`,
      "You are a progress analyst. No medical diagnosis.",
    );
  } catch {
    summary = `Month ${key}: weight ${firstW ?? "?"} → ${lastW ?? "?"} (Δ ${delta ?? "n/a"} kg). Workouts ${workouts.length}, adherence ${adherence ?? "n/a"}%. Photos ${photos.length}.`;
  }

  const confidence = photos.length >= 2 ? 0.75 : photos.length === 1 ? 0.55 : 0.4;

  const row = await prisma.monthlyProgressReport.upsert({
    where: { userId_monthKey: { userId, monthKey: key } },
    create: { userId, monthKey: key, summary, metrics, confidence },
    update: { summary, metrics, confidence },
  }).catch(() => null);

  return { summary, metrics, confidence, id: row?.id };
}
