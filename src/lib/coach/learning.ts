/**
 * Coach intelligence — store corrections that influence future AI context.
 */
import { prisma } from "@/lib/db";

export async function recordCoachCorrection(opts: {
  coachId: string;
  athleteId: string;
  context: string;
  correction: string;
}) {
  return prisma.coachLearningNote.create({ data: opts });
}

export async function getCoachLearningForAthlete(athleteId: string, take = 8): Promise<string> {
  const notes = await prisma.coachLearningNote.findMany({
    where: { athleteId },
    orderBy: { createdAt: "desc" },
    take,
  }).catch(() => []);
  if (!notes.length) return "";
  return (
    "COACH PREFERENCES / CORRECTIONS:\n" +
    notes.map((n) => `- ${n.context}: ${n.correction}`).join("\n")
  );
}
