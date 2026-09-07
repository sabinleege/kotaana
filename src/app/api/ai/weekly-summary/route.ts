import { requireUser } from "@/lib/authz";
import { route, json } from "@/lib/api";
import { getWeeklySummary, refreshWeeklySummary, getAiMemoryContext } from "@/lib/memory/weekly-summary";
import { guardAi } from "@/lib/rate-limit";

export const GET = route(async () => {
  const me = await requireUser();
  const existing = await getWeeklySummary(me.id);
  const context = await getAiMemoryContext(me.id);
  return json({ summary: existing, context, stale: !existing });
});

export const POST = route(async (req: Request) => {
  const me = await requireUser();
  await guardAi(req, me.id);
  const summary = await refreshWeeklySummary(me.id);
  return json({ summary });
});
