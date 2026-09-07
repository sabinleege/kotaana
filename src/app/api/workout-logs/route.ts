import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/authz";
import { route, json } from "@/lib/api";
import { toSnake } from "@/lib/serialize";

// GET /api/workout-logs — own workout logs (recent)
export const GET = route(async () => {
  const me = await requireUser();
  const rows = await prisma.workoutLog.findMany({
    where: { userId: me.id },
    orderBy: { date: "desc" },
    take: 30,
  });
  return json(toSnake(rows));
});

const createSchema = z.object({
  date: z.string(),
  completion_rate: z.number().min(0).max(1),
  notes: z.string().nullable().optional(),
  plan_id: z.string().nullable().optional(),
});

// POST /api/workout-logs — log a workout for a day
export const POST = route(async (req: Request) => {
  const me = await requireUser();
  const input = createSchema.parse(await req.json());
  const row = await prisma.workoutLog.create({
    data: {
      userId: me.id,
      date: new Date(input.date),
      completionRate: input.completion_rate,
      notes: input.notes ?? null,
      planId: input.plan_id ?? null,
    },
  });
  return json(toSnake(row), 201);
});
