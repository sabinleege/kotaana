import { requireUser } from "@/lib/authz";
import { route, json } from "@/lib/api";
import { requireCoach, countActiveMembers } from "@/lib/coach/access";
import { prisma } from "@/lib/db";

export const GET = route(async () => {
  const me = await requireUser();
  await requireCoach(me.id);

  const sub = await prisma.subscription.findUnique({ where: { userId: me.id } });
  const usedSeats = await countActiveMembers(me.id);

  return json({
    planType: sub?.planType || "free",
    status: sub?.status || "inactive",
    seatLimit: sub?.seatLimit ?? 0,
    usedSeats,
    coversAthletes: sub?.coversAthletes ?? true,
    currentPeriodEnd: sub?.currentPeriodEnd,
  });
});
