import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser, requireCoachOfAthlete } from "@/lib/authz";
import { route, json } from "@/lib/api";
import { toSnake } from "@/lib/serialize";

const athleteInclude = {
  athlete: { select: { profile: { select: { userId: true, fullName: true, avatarUrl: true, email: true } } } },
} as const;

function shapeInjury(i: any) {
  const { athlete, ...rest } = i;
  const p = athlete?.profile;
  return toSnake({
    ...rest,
    athlete: p ? { id: p.userId, fullName: p.fullName, avatarUrl: p.avatarUrl, email: p.email } : null,
  });
}

// GET /api/injuries?athleteId=&activeOnly=
// Athletes see their own; coaches see their linked athletes'.
export const GET = route(async (req: Request) => {
  const me = await requireUser();
  const url = new URL(req.url);
  const activeOnly = url.searchParams.get("activeOnly") === "true";
  const isCoach = me.role === "coach" || me.role === "admin";

  let where: any;
  if (isCoach) {
    const athleteId = url.searchParams.get("athleteId") ?? undefined;
    const rels = await prisma.coachAthleteRelation.findMany({ where: { coachId: me.id }, select: { athleteId: true } });
    const allowed = new Set(rels.map((r) => r.athleteId));
    if (athleteId && !allowed.has(athleteId)) return json([]);
    where = { athleteId: athleteId ? athleteId : { in: [...allowed] } };
  } else {
    where = { athleteId: me.id };
  }
  if (activeOnly) where.status = { not: "resolved" };

  const injuries = await prisma.injury.findMany({
    where,
    orderBy: { dateReported: "desc" },
    include: athleteInclude,
  });
  return json(injuries.map(shapeInjury));
});

const createSchema = z.object({
  athlete_id: z.string().uuid().optional(),
  body_part: z.string().min(1),
  injury_type: z.string().min(1),
  severity: z.number().int().min(1).max(5),
  status: z.enum(["active", "recovering", "resolved"]).default("active"),
  date_reported: z.string().optional(),
  expected_return: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  attachment_url: z.string().nullable().optional(),
});

// POST /api/injuries — athlete logs their own; coach logs for a linked athlete.
export const POST = route(async (req: Request) => {
  const me = await requireUser();
  const input = createSchema.parse(await req.json());
  const isCoach = me.role === "coach" || me.role === "admin";

  let athleteId: string;
  if (isCoach) {
    if (!input.athlete_id) return json({ error: "athlete_id required" }, 400);
    await requireCoachOfAthlete(me.id, input.athlete_id);
    athleteId = input.athlete_id;
  } else {
    athleteId = me.id; // athletes always log for themselves
  }

  const created = await prisma.injury.create({
    data: {
      athleteId,
      bodyPart: input.body_part,
      injuryType: input.injury_type,
      severity: input.severity,
      status: input.status,
      dateReported: input.date_reported ? new Date(input.date_reported) : undefined,
      expectedReturn: input.expected_return ? new Date(input.expected_return) : null,
      notes: input.notes ?? null,
      attachmentUrl: input.attachment_url ?? null,
    },
    include: athleteInclude,
  });
  return json(shapeInjury(created), 201);
});
