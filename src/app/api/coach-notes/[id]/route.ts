import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/authz";
import { route, json } from "@/lib/api";

// DELETE /api/coach-notes/:id
export const DELETE = route(
  async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
    const coach = await requireRole("coach", "admin");
    const { id } = await ctx.params;

    const existing = await prisma.coachNote.findUnique({ where: { id }, select: { coachId: true } });
    if (!existing || existing.coachId !== coach.id) return json({ error: "Not found" }, 404);

    await prisma.coachNote.delete({ where: { id } });
    return json({ ok: true });
  },
);
