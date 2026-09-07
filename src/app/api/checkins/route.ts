import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/authz";
import { route, json } from "@/lib/api";
import { toSnake } from "@/lib/serialize";

function computeReadiness(i: { energy: number; soreness: number; mood: number; sleepHours?: number | null; feeling: string }) {
  const sleepScore = Math.max(0, Math.min(1, (i.sleepHours ?? 7) / 8));
  let r = (i.energy / 5) * 35 + ((6 - i.soreness) / 5) * 30 + (i.mood / 5) * 20 + sleepScore * 15;
  if (i.feeling === "sick") r = Math.min(r, 30);
  else if (i.feeling === "off") r = Math.min(r, 55);
  else if (i.feeling === "great") r = Math.max(r, 75);
  return Math.round(Math.max(0, Math.min(100, r)));
}

// GET /api/checkins?date=YYYY-MM-DD  (defaults to today) or ?list=1 for recent
export const GET = route(async (req: Request) => {
  const me = await requireUser();
  const url = new URL(req.url);
  if (url.searchParams.get("list")) {
    const rows = await prisma.dailyCheckin.findMany({ where: { userId: me.id }, orderBy: { date: "desc" }, take: 30 });
    return json(toSnake(rows));
  }
  const date = url.searchParams.get("date") ?? new Date().toISOString().slice(0, 10);
  const row = await prisma.dailyCheckin.findUnique({ where: { userId_date: { userId: me.id, date: new Date(date) } } });
  return json(row ? toSnake(row) : null);
});

const upsertSchema = z.object({
  date: z.string().optional(),
  energy: z.number().int().min(1).max(5),
  soreness: z.number().int().min(1).max(5),
  mood: z.number().int().min(1).max(5),
  sleep_hours: z.number().min(0).max(24).nullable().optional(),
  feeling: z.enum(["great", "ok", "off", "sick"]).default("ok"),
  symptoms: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

// POST /api/checkins — save today's readiness check-in (upsert)
export const POST = route(async (req: Request) => {
  const me = await requireUser();
  const input = upsertSchema.parse(await req.json());
  const date = new Date(input.date ?? new Date().toISOString().slice(0, 10));
  const readiness = computeReadiness({ energy: input.energy, soreness: input.soreness, mood: input.mood, sleepHours: input.sleep_hours, feeling: input.feeling });

  const data = {
    energy: input.energy, soreness: input.soreness, mood: input.mood,
    sleepHours: input.sleep_hours ?? null, feeling: input.feeling,
    symptoms: input.symptoms ?? null, notes: input.notes ?? null, readiness,
  };
  const row = await prisma.dailyCheckin.upsert({
    where: { userId_date: { userId: me.id, date } },
    update: data,
    create: { userId: me.id, date, ...data },
  });

  // Nudge recovery score toward readiness + force the AI report to rebuild.
  await prisma.profile.update({ where: { userId: me.id }, data: { recoveryScore: readiness, aiReportAt: null } }).catch(() => {});

  return json(toSnake(row), 201);
});
