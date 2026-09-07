import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/authz";
import { route, json } from "@/lib/api";

// DELETE /api/progress-photos/:id
export const DELETE = route(async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const me = await requireUser();
  const { id } = await ctx.params;
  const existing = await prisma.progressPhoto.findUnique({ where: { id }, select: { userId: true } });
  if (!existing || existing.userId !== me.id) return json({ error: "Not found" }, 404);
  await prisma.progressPhoto.delete({ where: { id } });
  return json({ ok: true });
});
