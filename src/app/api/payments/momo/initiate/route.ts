/**
 * POST /api/payments/momo/initiate
 *
 * DISABLED. This was the automated MTN MoMo "request to pay" flow. That
 * integration is not wired up (lib/payments/momo.ts exports no client), so the
 * route could not compile, let alone run.
 *
 * The live flow is manual: the athlete/coach pays the platform MoMo code shown
 * in the app, then submits a request via POST /api/payments/momo, which an
 * owner approves at /admin/payments.
 */

import { route, json } from "@/lib/api";

export const POST = route(async () => {
  return json(
    {
      error:
        "Automated MoMo collection is not enabled. Pay the platform MoMo code shown in Subscription, then submit your payment for approval.",
    },
    501,
  );
});
