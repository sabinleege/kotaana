import { requireUser } from "@/lib/authz";
import { route, json } from "@/lib/api";
import { buildGoalPlan } from "@/lib/goals/planner";
import { guardAi } from "@/lib/rate-limit";

export const POST = route(async (req: Request) => {
  const me = await requireUser();
  await guardAi(req, me.id);
  const plan = await buildGoalPlan(me.id);
  return json({ plan });
});

export const GET = route(async () => {
  const me = await requireUser();
  const { prisma } = await import("@/lib/db");
  const p = await prisma.profile.findUnique({ where: { userId: me.id }, select: { goalPlanJson: true } });
  return json({ plan: p?.goalPlanJson || null });
});
