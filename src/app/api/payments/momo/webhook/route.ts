/**
 * POST /api/payments/momo/webhook
 * MTN callback when payment status changes.
 */

import { z } from "zod";
import { route, json } from "@/lib/api";
import { activatePlan } from "@/lib/payments/webhooks";
import type { PlanId } from "@/lib/payments/plans";

const schema = z.object({
  referenceId: z.string(),
  status: z.enum(["pending", "successful", "failed"]),
  userId: z.string().optional(),
  planId: z.string().optional(),
  amount: z.number().optional(),
});

export const POST = route(async (req: Request) => {
  // In production verify MoMo signature / IP whitelist
  const body = schema.parse(await req.json());

  if (body.status === "successful" && body.userId && body.planId) {
    await activatePlan({
      userId: body.userId,
      planId: body.planId as PlanId,
      provider: "momo",
      externalId: body.referenceId,
    });
  }

  return json({ received: true });
});
