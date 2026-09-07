import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/authz";
import { route, json } from "@/lib/api";
import { toSnake } from "@/lib/serialize";

// GET /api/athletes — the signed-in coach's roster (profiles + relation status)
export const GET = route(async () => {
  const coach = await requireRole("coach", "admin");

  const relations = await prisma.coachAthleteRelation.findMany({
    where: { coachId: coach.id },
    orderBy: { createdAt: "desc" },
    include: { athlete: { include: { profile: true } } },
  });

  const athletes = relations
    .filter((r) => r.athlete.profile)
    .map((r) => {
      const p = r.athlete.profile!;
      return {
        id: p.userId,
        fullName: p.fullName,
        email: p.email,
        avatarUrl: p.avatarUrl,
        age: p.age,
        weight: p.weight,
        targetWeight: p.targetWeight,
        fitnessScore: p.fitnessScore,
        recoveryScore: p.recoveryScore,
        consistencyScore: p.consistencyScore,
        onboardingCompleted: p.onboardingCompleted,
        relationStatus: r.status,
      };
    });

  return json(toSnake(athletes));
});
