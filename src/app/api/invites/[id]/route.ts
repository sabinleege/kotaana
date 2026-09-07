import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/authz";
import { route, json } from "@/lib/api";
import { toSnake } from "@/lib/serialize";

// PATCH /api/invites/:id — revoke (coach owns it)
export const PATCH = route(
  async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
    const coach = await requireRole("coach", "admin");
    const { id } = await ctx.params;

    const existing = await prisma.coachInvite.findUnique({ where: { id }, select: { coachId: true } });
    if (!existing || existing.coachId !== coach.id) return json({ error: "Not found" }, 404);

    const updated = await prisma.coachInvite.update({
      where: { id },
      data: { status: "revoked" },
    });
    return json(toSnake(updated));
  },
);
