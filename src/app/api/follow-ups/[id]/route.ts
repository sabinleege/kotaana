import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/authz";
import { route, json } from "@/lib/api";
import { toSnake } from "@/lib/serialize";

const patchSchema = z.object({
  title: z.string().optional(),
  description: z.string().nullable().optional(),
  due_date: z.string().nullable().optional(),
  priority: z.enum(["low", "normal", "high"]).optional(),
  status: z.enum(["pending", "done", "snoozed"]).optional(),
});

// PATCH /api/follow-ups/:id  (coach owns the follow-up)
export const PATCH = route(
  async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
    const coach = await requireRole("coach", "admin");
    const { id } = await ctx.params;
    const patch = patchSchema.parse(await req.json());

    const existing = await prisma.followUp.findUnique({ where: { id }, select: { coachId: true } });
    if (!existing || existing.coachId !== coach.id) return json({ error: "Not found" }, 404);

    const updated = await prisma.followUp.update({
      where: { id },
      data: {
        title: patch.title,
        description: patch.description,
        dueDate: patch.due_date === undefined ? undefined : patch.due_date ? new Date(patch.due_date) : null,
        priority: patch.priority,
        status: patch.status,
      },
    });
    return json(toSnake(updated));
  },
);
