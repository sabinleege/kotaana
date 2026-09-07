/**
 * Coach access helpers — only manage linked active athletes.
 * Wire to Prisma in production.
 */

import { prisma } from "@/lib/db";
import { AuthError } from "@/lib/authz";

export async function requireCoach(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, role: true, email: true, name: true } });
  if (!user || user.role !== "coach") {
    throw new AuthError(403, "Coach access only");
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
    throw new AuthError(403, "Not managing this athlete");
  }
  return rel;
}

export async function countActiveMembers(coachId: string) {
  return prisma.coachAthleteRelation.count({
    where: { coachId, status: "active" },
  });
}
