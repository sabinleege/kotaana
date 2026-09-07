import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireRole, requireCoachOfAthlete } from "@/lib/authz";
import { route, json } from "@/lib/api";
import { toSnake } from "@/lib/serialize";

// GET /api/coach-notes?athleteId=
export const GET = route(async (req: Request) => {
  const coach = await requireRole("coach", "admin");
  const athleteId = new URL(req.url).searchParams.get("athleteId");
  if (!athleteId) return json({ error: "athleteId required" }, 400);

  const notes = await prisma.coachNote.findMany({
    where: { coachId: coach.id, athleteId },
    orderBy: { createdAt: "desc" },
  });
  return json(toSnake(notes));
});

const createSchema = z.object({
  athlete_id: z.string().uuid(),
  content: z.string().min(1),
  visible_to_athlete: z.boolean().default(false),
});

// POST /api/coach-notes
export const POST = route(async (req: Request) => {
  const coach = await requireRole("coach", "admin");
  const input = createSchema.parse(await req.json());
  await requireCoachOfAthlete(coach.id, input.athlete_id);

  const created = await prisma.coachNote.create({
    data: {
      coachId: coach.id,
      athleteId: input.athlete_id,
      content: input.content,
      visibleToAthlete: input.visible_to_athlete,
    },
  });
  return json(toSnake(created), 201);
});
