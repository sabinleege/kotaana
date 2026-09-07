/**
 * POST /api/payments/stripe/webhook
 *
 * DISABLED. Cards/Stripe are off across the product — see lib/payments/stripe.ts.
 * Signature verification is not available, so this must never activate a plan.
 */

import { route, json } from "@/lib/api";

export const POST = route(async () => {
  return json({ error: "Stripe webhooks are disabled." }, 410);
});
