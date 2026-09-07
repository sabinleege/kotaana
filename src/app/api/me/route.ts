import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/authz";
import { route, json } from "@/lib/api";
import { ensureDayRollover, dayKey } from "@/lib/day/rollover";
import { ensureDailyReport } from "@/lib/daily/report";

export const GET = route(async () => {
  const me = await requireUser();
  const roll = await ensureDayRollover(me.id);
  // Ensure today's report exists (once/day); session built lazily on card fetch
  await ensureDailyReport(me.id).catch(() => null);

  const profile = await prisma.profile.findUnique({
    where: { userId: me.id },
    select: {
      fullName: true,
      onboardingCompleted: true,
      avatarUrl: true,
      waterGlasses: true,
      waterTarget: true,
      lastDayKey: true,
      dailyReportDate: true,
    },
  });

  return json({
    id: me.id,
    email: me.email,
    role: me.role,
    fullName: profile?.fullName ?? "",
    onboardingCompleted: profile?.onboardingCompleted ?? false,
    dayKey: roll.dayKey || dayKey(),
    dayRolled: roll.rolled,
    waterGlasses: profile?.waterGlasses ?? 0,
    waterTarget: profile?.waterTarget ?? 8,
    dailyReportDate: profile?.dailyReportDate ?? null,
  });
});
