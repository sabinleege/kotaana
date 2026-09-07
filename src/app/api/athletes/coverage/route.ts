import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/authz";
import { route, json } from "@/lib/api";
import { toSnake } from "@/lib/serialize";

// GET /api/athletes/coverage — relations with coverage flag + athlete profile
export const GET = route(async () => {
  const coach = await requireRole("coach", "admin");
  const rels = await prisma.coachAthleteRelation.findMany({
    where: { coachId: coach.id },
    include: { athlete: { select: { profile: { select: { userId: true, fullName: true, email: true, avatarUrl: true } } } } },
  });
  const shaped = rels
    .filter((r) => r.athlete.profile)
    .map((r) => {
      const p = r.athlete.profile!;
      return {
        athleteId: r.athleteId,
        coveredByCoach: r.coveredByCoach,
        status: r.status,
        profiles: { id: p.userId, fullName: p.fullName, email: p.email, avatarUrl: p.avatarUrl },
      };
    });
  return json(toSnake(shaped));
});

const patchSchema = z.object({
  athlete_id: z.string().uuid(),
  covered: z.boolean(),
});

// PATCH /api/athletes/coverage — toggle coverage for one athlete
export const PATCH = route(async (req: Request) => {
  const coach = await requireRole("coach", "admin");
  const { athlete_id, covered } = patchSchema.parse(await req.json());

  const rel = await prisma.coachAthleteRelation.findUnique({
    where: { coachId_athleteId: { coachId: coach.id, athleteId: athlete_id } },
    select: { id: true },
  });
  if (!rel) return json({ error: "Not found" }, 404);

  await prisma.coachAthleteRelation.update({
    where: { id: rel.id },
    data: { coveredByCoach: covered },
  });
  return json({ ok: true });
});
