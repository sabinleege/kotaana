/**
 * POST /api/payments/stripe/webhook
 * Handles checkout.session.completed and subscription events.
 */

import { route, json } from "@/lib/api";
import { constructWebhookEvent } from "@/lib/payments/stripe";
import { activatePlan, markPastDue, cancelPlan } from "@/lib/payments/webhooks";
import type { PlanId } from "@/lib/payments/plans";

export const POST = route(async (req: Request) => {
  const rawBody = await req.text();
  const signature = req.headers.get("stripe-signature") || "";

  let event: any;
  try {
    event = constructWebhookEvent(rawBody, signature);
  } catch (err) {
    return json({ error: "Invalid webhook signature" }, 400);
  }

  const type = event.type || event?.data?.type;

  try {
    if (type === "checkout.session.completed") {
      const session = event.data?.object || event.object || {};
      const userId = session.client_reference_id || session.metadata?.userId;
      const planId = (session.metadata?.planId || "pro") as PlanId;
      if (userId) {
        await activatePlan({
          userId,
          planId,
          provider: "stripe",
          externalId: session.subscription || session.id,
        });
      }
    }

    if (type === "customer.subscription.updated") {
      const sub = event.data?.object || {};
      const userId = sub.metadata?.userId;
      if (userId && sub.status === "past_due") {
        await markPastDue(userId);
      }
    }

    if (type === "customer.subscription.deleted") {
      const sub = event.data?.object || {};
      const userId = sub.metadata?.userId;
      if (userId) await cancelPlan(userId);
    }
  } catch (err) {
    console.error("[stripe webhook]", err);
    return json({ error: "Webhook handler failed" }, 500);
  }

  return json({ received: true });
});
