import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/authz";
import { route, json } from "@/lib/api";
import { toSnake } from "@/lib/serialize";

// GET /api/activity — own activity data (recent 14 days)
export const GET = route(async () => {
  const me = await requireUser();
  const rows = await prisma.activityData.findMany({
    where: { userId: me.id },
    orderBy: { date: "desc" },
    take: 14,
  });
  return json(toSnake(rows));
});

const upsertSchema = z.object({
  date: z.string(),
  day: z.string(),
  calories: z.number().int().nonnegative(),
});

// POST /api/activity — upsert a day's calories
export const POST = route(async (req: Request) => {
  const me = await requireUser();
  const { date, day, calories } = upsertSchema.parse(await req.json());
  const d = new Date(date);
  const row = await prisma.activityData.upsert({
    where: { userId_date: { userId: me.id, date: d } },
    update: { calories, day },
    create: { userId: me.id, date: d, day, calories },
  });
  return json(toSnake(row), 201);
});
