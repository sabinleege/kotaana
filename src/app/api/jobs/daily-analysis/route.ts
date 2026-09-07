import { route, json } from "@/lib/api";
import { runDailyAnalysisBatch, runWeeklySummaryBatch } from "@/lib/jobs/daily-analysis";

/** Cron/secured: protect with CRON_SECRET header in production */
export const POST = route(async (req: Request) => {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("x-cron-secret") !== secret) {
    return json({ error: "Unauthorized" }, 401);
  }
  const body = await req.json().catch(() => ({}));
  if (body.mode === "weekly") {
    return json(await runWeeklySummaryBatch(body.limit));
  }
  return json({ results: await runDailyAnalysisBatch(body.limit) });
});
