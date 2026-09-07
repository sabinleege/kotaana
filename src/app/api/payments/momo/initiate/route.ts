/**
 * POST /api/payments/momo/initiate
 * Body: { planId, phone, amount?, currency? }
 */

import { z } from "zod";
import { requireUser } from "@/lib/authz";
import { route, json } from "@/lib/api";
import { initiateMomoPayment } from "@/lib/payments/momo";
import { getPlan, type PlanId } from "@/lib/payments/plans";

const schema = z.object({
  planId: z.enum(["pro", "starter", "mini", "max"]),
  phone: z.string().min(9).max(15),
  amount: z.number().positive().optional(),
  currency: z.string().default("UGX"),
});

export const POST = route(async (req: Request) => {
  const me = await requireUser();
  const body = schema.parse(await req.json());
  const plan = getPlan(body.planId);

  // Simple amount mapping — replace with real FX / local pricing table
  const amount = body.amount ?? plan.priceUsd * 3700; // rough UGX example

  const result = await initiateMomoPayment({
    userId: me.id,
    phone: body.phone,
    amount,
    currency: body.currency,
    planId: body.planId,
  });

  // Store pending reference somewhere (Payment table later)
  return json({
    referenceId: result.referenceId,
    status: result.status,
    message: result.message,
    planId: body.planId,
  });
});
