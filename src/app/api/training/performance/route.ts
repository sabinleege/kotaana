/**
 * Log effort on an exercise so next daily session can progress bit by bit.
 */
import { z } from "zod";
import { requireUser } from "@/lib/authz";
import { route, json } from "@/lib/api";
import { prisma } from "@/lib/db";
import { dayKey } from "@/lib/day/rollover";

const schema = z.object({
  exerciseId: z.string(),
  exerciseName: z.string().optional(),
  setsDone: z.number().int().optional(),
  repsDone: z.string().optional(),
  effort: z.enum(["easy", "ok", "hard"]),
});

export const POST = route(async (req: Request) => {
  const me = await requireUser();
  const body = schema.parse(await req.json());
  const row = await prisma.exercisePerformance.create({
    data: {
      userId: me.id,
      exerciseId: body.exerciseId,
      exerciseName: body.exerciseName,
      date: new Date(dayKey()),
      setsDone: body.setsDone,
      repsDone: body.repsDone,
      effort: body.effort,
    },
  });
  return json({ performance: row }, 201);
});

export const GET = route(async () => {
  const me = await requireUser();
  const rows = await prisma.exercisePerformance.findMany({
    where: { userId: me.id },
    orderBy: { date: "desc" },
    take: 50,
  });
  return json({ performances: rows });
});
