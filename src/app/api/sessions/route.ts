import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/authz";
import { route, json } from "@/lib/api";
import { toSnake } from "@/lib/serialize";

// GET /api/sessions — coach's training sessions
export const GET = route(async () => {
  const coach = await requireRole("coach", "admin");
  const sessions = await prisma.trainingSession.findMany({
    where: { coachId: coach.id },
    orderBy: { scheduledAt: "asc" },
  });
  return json(toSnake(sessions));
});

const createSchema = z.object({
  title: z.string().min(1),
  athlete_ids: z.array(z.string().uuid()).default([]),
  scheduled_at: z.string(),
  duration_minutes: z.number().int().positive().default(60),
  location: z.string().nullable().optional(),
  session_type: z.enum(["training", "court", "assessment", "recovery", "team"]).default("training"),
  status: z.enum(["scheduled", "completed", "cancelled", "no_show"]).default("scheduled"),
  notes: z.string().nullable().optional(),
});

// POST /api/sessions
export const POST = route(async (req: Request) => {
  const coach = await requireRole("coach", "admin");
  const input = createSchema.parse(await req.json());
  const created = await prisma.trainingSession.create({
    data: {
      coachId: coach.id,
      title: input.title,
      athleteIds: input.athlete_ids,
      scheduledAt: new Date(input.scheduled_at),
      durationMinutes: input.duration_minutes,
      location: input.location ?? null,
      sessionType: input.session_type,
      status: input.status,
      notes: input.notes ?? null,
    },
  });
  return json(toSnake(created), 201);
});
