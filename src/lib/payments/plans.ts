/**
 * Subscription plans & AI credit allowances
 * Coaches pay; athletes can be covered by a coach plan.
 */

export type PlanId = "free" | "starter" | "mini" | "max" | "pro";

export type Plan = {
  id: PlanId;
  name: string;
  priceUsd: number;          // monthly
  priceLocalHint?: string;   // e.g. "MTN MoMo available"
  seatLimit: number | null;  // null = unlimited / n/a
  coversAthletes: boolean;
  aiCreditsPerDay: number;
  features: string[];
};

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: "free",
    name: "Free",
    priceUsd: 0,
    seatLimit: 0,
    coversAthletes: false,
    aiCreditsPerDay: 20,
    features: ["Personal tracking", "Weight & meal logging", "Progress charts", "20 AI actions/day"],
  },
  pro: {
    id: "pro",
    name: "Pro (Athlete)",
    priceUsd: 9,
    seatLimit: 0,
    coversAthletes: false,
    aiCreditsPerDay: 120,
    features: ["Everything in Free", "AI workout plans", "AI meal & photo analysis", "Coach connection", "120 AI actions/day"],
  },
  starter: {
    id: "starter",
    name: "Coach Starter",
    priceUsd: 29,
    priceLocalHint: "MTN MoMo available",
    seatLimit: 10,
    coversAthletes: true,
    aiCreditsPerDay: 300,
    features: ["Up to 10 athletes", "Notes & follow-ups", "Sessions", "Basic analytics"],
  },
  mini: {
    id: "mini",
    name: "Coach Mini",
    priceUsd: 59,
    priceLocalHint: "MTN MoMo available",
    seatLimit: 30,
    coversAthletes: true,
    aiCreditsPerDay: 800,
    features: ["Up to 30 athletes", "Everything in Starter", "Reports", "Priority support"],
  },
  max: {
    id: "max",
    name: "Coach Max",
    priceUsd: 149,
    priceLocalHint: "MTN MoMo available",
    seatLimit: 100,
    coversAthletes: true,
    aiCreditsPerDay: 2500,
    features: ["Up to 100 athletes", "Everything in Mini", "Advanced analytics", "Custom branding later"],
  },
};

export function getPlan(id: string): Plan {
  return PLANS[id as PlanId] ?? PLANS.free;
}
