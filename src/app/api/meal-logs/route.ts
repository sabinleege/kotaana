import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/authz";
import { route, json } from "@/lib/api";
import { toSnake } from "@/lib/serialize";

// GET /api/meal-logs?date=YYYY-MM-DD — a day's log (or recent list if no date)
export const GET = route(async (req: Request) => {
  const me = await requireUser();
  const date = new URL(req.url).searchParams.get("date");
  if (date) {
    const row = await prisma.mealLog.findUnique({
      where: { userId_date: { userId: me.id, date: new Date(date) } },
    });
    return json(row ? toSnake(row) : null);
  }
  const rows = await prisma.mealLog.findMany({
    where: { userId: me.id },
    orderBy: { date: "desc" },
    take: 30,
  });
  return json(toSnake(rows));
});

const upsertSchema = z.object({
  date: z.string(),
  meals: z.array(z.any()),
  total_calories: z.number().int().nonnegative().default(0),
  total_protein: z.number().int().nonnegative().default(0),
});

// POST /api/meal-logs — upsert a day's meals
export const POST = route(async (req: Request) => {
  const me = await requireUser();
  const input = upsertSchema.parse(await req.json());
  const d = new Date(input.date);
  const row = await prisma.mealLog.upsert({
    where: { userId_date: { userId: me.id, date: d } },
    update: { meals: input.meals, totalCalories: input.total_calories, totalProtein: input.total_protein },
    create: {
      userId: me.id, date: d, meals: input.meals,
      totalCalories: input.total_calories, totalProtein: input.total_protein,
    },
  });
  return json(toSnake(row), 201);
});
