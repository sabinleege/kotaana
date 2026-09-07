/**
 * POST /api/payments/stripe/checkout
 *
 * DISABLED. Cards/Stripe are off across the product — see lib/payments/stripe.ts.
 * Kotaana collects via MTN MoMo with manual owner approval.
 */

import { route, json } from "@/lib/api";

export const POST = route(async () => {
  return json(
    { error: "Card payments are disabled. Use MoMo in Subscription settings." },
    501,
  );
});
