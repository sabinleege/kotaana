// AI calls take 15-30s; without this Vercel kills the function before it can
// answer and the caller receives nothing at all.
export const maxDuration = 60;

/**
 * GET — today's session cards (builds once per day from daily report + dataset).
 * POST — force rebuild session (still same day report unless ?refreshReport=1).
 */
import { requireUser } from "@/lib/authz";
import { route, json } from "@/lib/api";
import { ensureDayRollover } from "@/lib/day/rollover";
import { getOrBuildDailySession, buildDailySession } from "@/lib/daily/session-builder";
import { ensureDailyReport } from "@/lib/daily/report";

export const GET = route(async () => {
  const me = await requireUser();
  await ensureDayRollover(me.id);
  await ensureDailyReport(me.id);
  const session = await getOrBuildDailySession(me.id);
  return json({ session });
});

export const POST = route(async (req: Request) => {
  const me = await requireUser();
  await ensureDayRollover(me.id);
  const url = new URL(req.url);
  if (url.searchParams.get("refreshReport") === "1") {
    // force report rebuild by clearing date
    const { prisma } = await import("@/lib/db");
    await prisma.profile.update({
      where: { userId: me.id },
      data: { dailyReportDate: null, dailyReportText: null },
    });
  }
  await ensureDailyReport(me.id);
  const session = await buildDailySession(me.id);
  return json({ session, rebuilt: true });
});
