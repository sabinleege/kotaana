import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/authz";
import { route, json } from "@/lib/api";
import { toSnake } from "@/lib/serialize";

// GET /api/runs — the user's recent runs/walks/rides
export const GET = route(async () => {
  const me = await requireUser();
  const rows = await prisma.runActivity.findMany({ where: { userId: me.id }, orderBy: { createdAt: "desc" }, take: 60 });
  return json(toSnake(rows));
});

const createSchema = z.object({
  activity_type: z.enum(["run", "walk", "ride"]).default("run"),
  distance_km: z.number().nonnegative(),
  duration_sec: z.number().int().nonnegative(),
  calories: z.number().int().nonnegative().default(0),
  avg_pace_sec: z.number().int().nullable().optional(),
  path: z.any().optional(),
  source: z.enum(["gps", "manual"]).default("gps"),
});

// POST /api/runs — save a completed run; also rolls into daily activity calories
export const POST = route(async (req: Request) => {
  const me = await requireUser();
  const input = createSchema.parse(await req.json());
  const now = new Date();
  const date = new Date(now.toISOString().slice(0, 10));
  const day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][now.getDay()];

  const run = await prisma.runActivity.create({
    data: {
      userId: me.id, date, activityType: input.activity_type,
      distanceKm: input.distance_km, durationSec: input.duration_sec,
      calories: input.calories, avgPaceSec: input.avg_pace_sec ?? null,
      path: input.path ?? undefined, source: input.source,
    },
  });

  // Add the burned calories into today's activity total.
  if (input.calories > 0) {
    const existing = await prisma.activityData.findUnique({ where: { userId_date: { userId: me.id, date } } });
    await prisma.activityData.upsert({
      where: { userId_date: { userId: me.id, date } },
      update: { calories: (existing?.calories ?? 0) + input.calories },
      create: { userId: me.id, date, day, calories: input.calories },
    });
  }

  return json(toSnake(run), 201);
});
