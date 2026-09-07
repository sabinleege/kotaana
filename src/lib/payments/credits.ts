/**
 * AI credit balance helpers.
 * Uses Prisma Subscription + a simple daily counter approach.
 * Expand with CreditBalance / CreditTransaction tables when ready.
 */

import { prisma } from "@/lib/db";
import { getPlan } from "./plans";

export type CreditCheck = {
  allowed: boolean;
  remaining: number;
  limit: number;
  planId: string;
};

/** Very simple daily AI credit check (per user). */
export async function checkAiCredits(userId: string): Promise<CreditCheck> {
  const sub = await prisma.subscription.findUnique({ where: { userId } });
  const planId = sub?.planType ?? "free";
  const plan = getPlan(planId);
  const limit = plan.aiCreditsPerDay;

  // Count successful AI calls in the last 24h
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const used = await prisma.aiUsage.count({
    where: {
      userId,
      status: "success",
      createdAt: { gte: since },
    },
  });

  const remaining = Math.max(0, limit - used);
  return {
    allowed: remaining > 0,
    remaining,
    limit,
    planId,
  };
}

export async function assertAiCredits(userId: string): Promise<void> {
  const check = await checkAiCredits(userId);
  if (!check.allowed) {
    const err = new Error(
      `AI credit limit reached (${check.limit}/day on ${check.planId} plan). Upgrade or wait for reset.`,
    );
    (err as any).status = 402;
    throw err;
  }
}
