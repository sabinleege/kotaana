/**
 * Coach seat plans — as specified by product owner
 */

export type CoachPlanId = "coach_40" | "coach_80" | "enterprise";

export const COACH_PLANS: Record<
  CoachPlanId,
  { id: CoachPlanId; name: string; priceUsd: number; seatLimit: number; description: string }
> = {
  coach_40: {
    id: "coach_40",
    name: "Coach Standard",
    priceUsd: 40,
    seatLimit: 100,
    description: "Up to 100 athletes under management",
  },
  coach_80: {
    id: "coach_80",
    name: "Coach Plus",
    priceUsd: 80,
    seatLimit: 200,
    description: "More than 100 athletes (up to 200)",
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    priceUsd: 200,
    seatLimit: 1000,
    description: "200+ athletes under management",
  },
};

export function planForSeatCount(n: number): CoachPlanId {
  if (n <= 100) return "coach_40";
  if (n <= 200) return "coach_80";
  return "enterprise";
}
