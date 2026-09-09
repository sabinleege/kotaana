// AI calls take 15-30s; without this Vercel kills the function before it can
// answer and the caller receives nothing at all.
export const maxDuration = 60;

/**
 * Cron: daily (and optional weekly) AI analysis batch.
 *
 * Auth: `x-cron-secret: <CRON_SECRET>` or `Authorization: Bearer <CRON_SECRET>`.
 * GET exists because Vercel Cron issues GET; POST keeps the `mode`/`limit` body.
 */
import { route, json } from "@/lib/api";
import { assertCron } from "@/lib/cron";
import { runDailyAnalysisBatch, runWeeklySummaryBatch } from "@/lib/jobs/daily-analysis";

async function run(mode: string | null, limit: number | undefined) {
  if (mode === "weekly") {
    return json(await runWeeklySummaryBatch(limit));
  }
  return json({ results: await runDailyAnalysisBatch(limit) });
}

export const POST = route(async (req: Request) => {
  assertCron(req);
  const body = (await req.json().catch(() => ({}))) as { mode?: string; limit?: number };
  return run(body.mode ?? null, body.limit);
});

export const GET = route(async (req: Request) => {
  assertCron(req);
  const params = new URL(req.url).searchParams;
  const limit = params.get("limit") ? Number(params.get("limit")) : undefined;
  return run(params.get("mode"), limit);
});
