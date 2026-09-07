import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser, coachesAthlete, AuthError } from "@/lib/authz";
import { route, json } from "@/lib/api";
import { toSnake } from "@/lib/serialize";

// The current user may touch an injury if they own it (athlete) or coach its athlete.
async function assertCanEdit(injuryId: string, me: { id: string; role: string }) {
  const existing = await prisma.injury.findUnique({ where: { id: injuryId }, select: { athleteId: true } });
  if (!existing) throw new AuthError(404, "Not found");
  if (existing.athleteId === me.id) return existing;
  const isCoach = me.role === "coach" || me.role === "admin";
  if (isCoach && (await coachesAthlete(me.id, existing.athleteId))) return existing;
  throw new AuthError(403, "Not allowed");
}

const patchSchema = z.object({
  body_part: z.string().optional(),
  injury_type: z.string().optional(),
  severity: z.number().int().min(1).max(5).optional(),
  status: z.enum(["active", "recovering", "resolved"]).optional(),
  expected_return: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

// PATCH /api/injuries/:id
export const PATCH = route(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const me = await requireUser();
  const { id } = await ctx.params;
  await assertCanEdit(id, me);
  const patch = patchSchema.parse(await req.json());

  const updated = await prisma.injury.update({
    where: { id },
    data: {
      bodyPart: patch.body_part,
      injuryType: patch.injury_type,
      severity: patch.severity,
      status: patch.status,
      expectedReturn:
        patch.expected_return === undefined ? undefined : patch.expected_return ? new Date(patch.expected_return) : null,
      notes: patch.notes,
    },
  });
  return json(toSnake(updated));
});

// DELETE /api/injuries/:id
export const DELETE = route(async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const me = await requireUser();
  const { id } = await ctx.params;
  await assertCanEdit(id, me);
  await prisma.injury.delete({ where: { id } });
  return json({ ok: true });
});
