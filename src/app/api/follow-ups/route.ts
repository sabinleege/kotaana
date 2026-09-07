import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireRole, requireCoachOfAthlete } from "@/lib/authz";
import { route, json } from "@/lib/api";
import { toSnake } from "@/lib/serialize";

const athleteInclude = {
  athlete: { select: { profile: { select: { userId: true, fullName: true, avatarUrl: true } } } },
} as const;

function shape(f: { athlete: { profile: { userId: string; fullName: string; avatarUrl: string | null } | null } } & Record<string, unknown>) {
  const { athlete, ...rest } = f;
  const p = athlete?.profile;
  return toSnake({
    ...rest,
    athlete: p ? { id: p.userId, fullName: p.fullName, avatarUrl: p.avatarUrl } : null,
  });
}

// GET /api/follow-ups?athleteId=&status=
export const GET = route(async (req: Request) => {
  const coach = await requireRole("coach", "admin");
  const url = new URL(req.url);
  const athleteId = url.searchParams.get("athleteId") ?? undefined;
  const status = url.searchParams.get("status") ?? undefined;

  const list = await prisma.followUp.findMany({
    where: { coachId: coach.id, ...(athleteId ? { athleteId } : {}), ...(status ? { status } : {}) },
    orderBy: { dueDate: "asc" },
    include: athleteInclude,
  });
  return json(list.map(shape));
});

const createSchema = z.object({
  athlete_id: z.string().uuid(),
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  due_date: z.string().nullable().optional(),
  priority: z.enum(["low", "normal", "high"]).default("normal"),
  status: z.enum(["pending", "done", "snoozed"]).default("pending"),
});

// POST /api/follow-ups
export const POST = route(async (req: Request) => {
  const coach = await requireRole("coach", "admin");
  const input = createSchema.parse(await req.json());
  await requireCoachOfAthlete(coach.id, input.athlete_id);

  const created = await prisma.followUp.create({
    data: {
      coachId: coach.id,
      athleteId: input.athlete_id,
      title: input.title,
      description: input.description ?? null,
      dueDate: input.due_date ? new Date(input.due_date) : null,
      priority: input.priority,
      status: input.status,
    },
    include: athleteInclude,
  });
  return json(shape(created), 201);
});
