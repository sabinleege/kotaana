import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/authz";
import { route, json } from "@/lib/api";
import { toSnake } from "@/lib/serialize";

const patchSchema = z.object({
  title: z.string().optional(),
  athlete_ids: z.array(z.string().uuid()).optional(),
  scheduled_at: z.string().optional(),
  duration_minutes: z.number().int().positive().optional(),
  location: z.string().nullable().optional(),
  session_type: z.enum(["training", "court", "assessment", "recovery", "team"]).optional(),
  status: z.enum(["scheduled", "completed", "cancelled", "no_show"]).optional(),
  notes: z.string().nullable().optional(),
});

// PATCH /api/sessions/:id
export const PATCH = route(
  async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
    const coach = await requireRole("coach", "admin");
    const { id } = await ctx.params;
    const patch = patchSchema.parse(await req.json());

    const existing = await prisma.trainingSession.findUnique({ where: { id }, select: { coachId: true } });
    if (!existing || existing.coachId !== coach.id) return json({ error: "Not found" }, 404);

    const updated = await prisma.trainingSession.update({
      where: { id },
      data: {
        title: patch.title,
        athleteIds: patch.athlete_ids,
        scheduledAt: patch.scheduled_at ? new Date(patch.scheduled_at) : undefined,
        durationMinutes: patch.duration_minutes,
        location: patch.location,
        sessionType: patch.session_type,
        status: patch.status,
        notes: patch.notes,
      },
    });
    return json(toSnake(updated));
  },
);
