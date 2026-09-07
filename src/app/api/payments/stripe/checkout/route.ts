/**
 * POST /api/payments/stripe/checkout
 * Body: { planId: "pro" | "starter" | "mini" | "max" }
 */

import { z } from "zod";
import { requireUser } from "@/lib/authz";
import { route, json } from "@/lib/api";
import { createCheckoutSession } from "@/lib/payments/stripe";
import { PLANS, type PlanId } from "@/lib/payments/plans";

const schema = z.object({
  planId: z.enum(["pro", "starter", "mini", "max"]),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
});

export const POST = route(async (req: Request) => {
  const me = await requireUser();
  const body = schema.parse(await req.json());

  const origin = req.headers.get("origin") || process.env.AUTH_URL || "http://localhost:8080";
  const successUrl = body.successUrl || `${origin}/app/subscription?success=1`;
  const cancelUrl = body.cancelUrl || `${origin}/app/subscription?cancelled=1`;

  if (!PLANS[body.planId as PlanId]) {
    return json({ error: "Unknown plan" }, 400);
  }

  const session = await createCheckoutSession({
    userId: me.id,
    email: me.email || "",
    planId: body.planId as PlanId,
    successUrl,
    cancelUrl,
  });

  return json({ url: session.url, sessionId: session.sessionId });
});
