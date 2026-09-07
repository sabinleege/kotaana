"use client";

import { MomoPayPanel } from "@/components/payments/MomoPayPanel";

export default function CoachSubscriptionPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Coach plan — MoMo</h1>
      <p className="text-sm text-muted-foreground">
        Pay Kotaana on MoMo code <strong>8787</strong> for your seat plan. After approval, athlete management limits apply.
      </p>
      <MomoPayPanel role="coach" />
    </div>
  );
}
