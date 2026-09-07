import { requireUser } from "@/lib/authz";
import { route, json } from "@/lib/api";
import { buildMonthlyProgress } from "@/lib/progress/monthly-intelligence";
import { guardAi } from "@/lib/rate-limit";

export const POST = route(async (req: Request) => {
  const me = await requireUser();
  await guardAi(req, me.id);
  const body = await req.json().catch(() => ({}));
  const result = await buildMonthlyProgress(me.id, body.monthKey);
  return json(result);
});

export const GET = route(async () => {
  const me = await requireUser();
  const { prisma } = await import("@/lib/db");
  const rows = await prisma.monthlyProgressReport.findMany({
    where: { userId: me.id },
    orderBy: { monthKey: "desc" },
    take: 12,
  });
  return json({ reports: rows });
});
