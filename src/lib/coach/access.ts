/**
 * Coach access helpers — only manage linked active athletes.
 * Wire to Prisma in production.
 */

import { prisma } from "@/lib/db";

export async function requireCoach(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, role: true, email: true, name: true } });
  if (!user || user.role !== "coach") {
    const err = new Error("Coach access only");
    (err as any).status = 403;
    throw err;
  }
  return user;
}

export async function listManagedAthleteIds(coachId: string, includePaused = false) {
  const statuses = includePaused ? ["active", "paused"] : ["active"];
  const rows = await prisma.coachAthleteRelation.findMany({
    where: { coachId, status: { in: statuses } },
    select: { athleteId: true, status: true },
  });
  return rows;
}

export async function assertManages(coachId: string, athleteId: string) {
  const rel = await prisma.coachAthleteRelation.findFirst({
    where: { coachId, athleteId, status: "active" },
  });
  if (!rel) {
    const err = new Error("Not managing this athlete");
    (err as any).status = 403;
    throw err;
  }
  return rel;
}

export async function countActiveMembers(coachId: string) {
  return prisma.coachAthleteRelation.count({
    where: { coachId, status: "active" },
  });
}
