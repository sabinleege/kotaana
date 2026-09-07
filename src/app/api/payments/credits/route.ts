/**
 * GET /api/payments/credits — current AI credit status for the logged-in user
 */

import { requireUser } from "@/lib/authz";
import { route, json } from "@/lib/api";
import { checkAiCredits } from "@/lib/payments/credits";
import { getPlan } from "@/lib/payments/plans";

export const GET = route(async () => {
  const me = await requireUser();
  const credits = await checkAiCredits(me.id);
  const plan = getPlan(credits.planId);

  return json({
    planId: credits.planId,
    planName: plan.name,
    limit: credits.limit,
    remaining: credits.remaining,
    allowed: credits.allowed,
    coversAthletes: plan.coversAthletes,
    seatLimit: plan.seatLimit,
  });
});
