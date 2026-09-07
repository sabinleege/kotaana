"use client";

import { MomoPayPanel } from "@/components/payments/MomoPayPanel";

export default function AthleteSubscriptionPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Subscription & MoMo</h1>
      <p className="text-sm text-muted-foreground">
        Pay the platform with MoMo only. Cards and Stripe are not used.
      </p>
      <MomoPayPanel role="athlete" />
    </div>
  );
}
