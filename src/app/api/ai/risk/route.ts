import { requireUser } from "@/lib/authz";
import { route, json } from "@/lib/api";
import { computeRiskScore } from "@/lib/risk/health-risk";
import { guardAi } from "@/lib/rate-limit";

export const GET = route(async (req: Request) => {
  const me = await requireUser();
  await guardAi(req, me.id).catch(() => {});
  const scores = await computeRiskScore(me.id);
  return json({ scores });
});
