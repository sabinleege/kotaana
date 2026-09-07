/**
 * POST /api/payments/momo/webhook
 *
 * DISABLED. Kotaana runs MoMo on manual approval — an owner/coach approves each
 * request via /api/payments/momo/approve. Nothing should be activating plans here.
 *
 * This endpoint previously accepted an unsigned body and called activatePlan()
 * with a caller-supplied userId + planId, which let anyone grant themselves a
 * paid plan. It is kept as an explicit 410 so the URL cannot silently be
 * re-pointed at the old behaviour.
 *
 * To re-enable when the MTN MoMo API is wired up:
 *   1. verify the MTN signature (or X-Callback token) against MOMO_PRIMARY_KEY
 *      BEFORE parsing the body,
 *   2. look the referenceId up in your own Payment table and take userId/planId
 *      from THAT row — never from the request body,
 *   3. only then call activatePlan().
 */

import { route, json } from "@/lib/api";

export const POST = route(async () => {
  return json(
    { error: "MoMo webhooks are disabled. Payments are approved manually by the platform owner." },
    410,
  );
});
