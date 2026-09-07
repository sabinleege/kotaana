"use client";

import { useEffect, useState } from "react";
import { MomoPayPanel } from "@/components/payments/MomoPayPanel";
import Link from "next/link";
import { toast } from "sonner";

export default function CoachPaymentSettingsPage() {
  const [momoNumber, setMomoNumber] = useState("");
  const [momoName, setMomoName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/profile/momo")
      .then((r) => r.json())
      .then((d) => {
        setMomoNumber(d.momoNumber || "");
        setMomoName(d.momoName || "");
      })
      .catch(() => {});
  }, []);

  async function saveMomo() {
    if (!momoNumber.trim() || !momoName.trim()) {
      toast.error("Enter MoMo number and name");
      return;
    }
    setLoading(true);
    try {
      const r = await fetch("/api/profile/momo", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ momoNumber, momoName }),
      });
      if (!r.ok) throw new Error("Save failed");
      toast.success("MoMo saved — athletes can see it when they find you");
    } catch {
      toast.error("Could not save MoMo");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Payment settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Save your MoMo so athletes who search for you can see how to pay you. Platform fee still uses code{" "}
          <strong>8787</strong>.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 space-y-3 max-w-md">
        <h2 className="font-semibold text-sm">Your MoMo (visible when athletes find you)</h2>
        <input
          className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
          placeholder="MoMo number"
          value={momoNumber}
          onChange={(e) => setMomoNumber(e.target.value)}
        />
        <input
          className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
          placeholder="Name on MoMo"
          value={momoName}
          onChange={(e) => setMomoName(e.target.value)}
        />
        <button
          type="button"
          onClick={saveMomo}
          disabled={loading}
          className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          {loading ? "Saving…" : "Save MoMo"}
        </button>
      </div>

      <div>
        <h2 className="font-semibold text-sm mb-2">Pay Kotaana (platform)</h2>
        <p className="text-sm text-muted-foreground mb-3">
          Pending orders are approved by the app owner. Athlete payment approvals:{" "}
          <Link href="/coach/payments" className="text-primary underline">
            Athlete payments
          </Link>
          .
        </p>
        <MomoPayPanel role="coach" />
      </div>
    </div>
  );
}
