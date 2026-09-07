/**
 * MoMo-only payments — no Stripe / cards.
 * Platform collection code (pay to Kotaana): 8787
 */

export const PLATFORM_MOMO_CODE = process.env.PLATFORM_MOMO_CODE || "8787";
// Prefer getPlatformMomo() from platform.ts for live owner-set values.
export { getPlatformMomo, setPlatformMomo } from "@/lib/payments/platform";

export type PlanOption = {
  id: string;
  label: string;
  amountLabel: string;
  forRole: "athlete" | "coach" | "both";
  seatLimit?: number;
  description: string;
};

export const PLANS: PlanOption[] = [
  {
    id: "athlete_monthly",
    label: "Athlete",
    amountLabel: "10$",
    forRole: "athlete",
    description: "Full athlete app access",
  },
  {
    id: "team40",
    label: "Coach — up to 100 athletes",
    amountLabel: "40$",
    forRole: "coach",
    seatLimit: 100,
    description: "Manage up to 100 athletes",
  },
  {
    id: "team80",
    label: "Coach — up to 200 athletes",
    amountLabel: "80$",
    forRole: "coach",
    seatLimit: 200,
    description: "Manage up to 200 athletes",
  },
  {
    id: "enterprise",
    label: "Coach Enterprise",
    amountLabel: "200$",
    forRole: "coach",
    seatLimit: 9999,
    description: "200+ athletes / enterprise",
  },
];

export function planById(id: string) {
  return PLANS.find((p) => p.id === id);
}
