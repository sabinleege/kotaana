import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/authz";
import { route, json } from "@/lib/api";

const schema = z.object({ email: z.string().email() });

// POST /api/athletes/link — link an existing athlete (by email) to this coach's roster.
export const POST = route(async (req: Request) => {
  const coach = await requireRole("coach", "admin");
  const { email } = schema.parse(await req.json());

  const athlete = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: { id: true, role: true },
  });
  if (!athlete) return json({ error: "No Kotaana athlete found with that email" }, 404);
  if (athlete.id === coach.id) return json({ error: "That's your own account" }, 400);

  await prisma.coachAthleteRelation.upsert({
    where: { coachId_athleteId: { coachId: coach.id, athleteId: athlete.id } },
    update: { status: "active" },
    create: { coachId: coach.id, athleteId: athlete.id, status: "active" },
  });

  return json({ ok: true }, 201);
});
