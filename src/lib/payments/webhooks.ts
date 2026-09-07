/**
 * Shared webhook handlers for Stripe & MoMo.
 * Updates Subscription row after successful payment.
 */

import { prisma } from "@/lib/db";
import { getPlan, type PlanId } from "./plans";

export async function activatePlan(opts: {
  userId: string;
  planId: PlanId;
  provider: "stripe" | "momo";
  externalId?: string;
  periodEnd?: Date;
}) {
  const plan = getPlan(opts.planId);
  const periodEnd =
    opts.periodEnd ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  const sub = await prisma.subscription.upsert({
    where: { userId: opts.userId },
    update: {
      planType: plan.id,
      status: "active",
      coversAthletes: plan.coversAthletes,
      seatLimit: plan.seatLimit,
      currentPeriodEnd: periodEnd,
      ...(opts.provider === "stripe" && opts.externalId
        ? { stripeSubscriptionId: opts.externalId }
        : {}),
    },
    create: {
      userId: opts.userId,
      planType: plan.id,
      status: "active",
      coversAthletes: plan.coversAthletes,
      seatLimit: plan.seatLimit,
      currentPeriodEnd: periodEnd,
      ...(opts.provider === "stripe" && opts.externalId
        ? { stripeSubscriptionId: opts.externalId }
        : {}),
    },
  });

  return sub;
}

export async function markPastDue(userId: string) {
  return prisma.subscription.updateMany({
    where: { userId },
    data: { status: "past_due" },
  });
}

export async function cancelPlan(userId: string) {
  return prisma.subscription.updateMany({
    where: { userId },
    data: { status: "cancelled" },
  });
}
