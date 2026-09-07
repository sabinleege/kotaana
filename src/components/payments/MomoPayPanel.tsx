"use client";

import { useEffect, useState } from "react";
import { apiGet, apiPost, apiPatch } from "@/lib/fetcher";
import { PLANS, type PlanOption } from "@/lib/payments/momo";
import { toast } from "sonner";

type Props = { role: "athlete" | "coach" };

type PlatformMomo = { code: string; name: string; instructions: string };

export function MomoPayPanel({ role }: Props) {
  const plans = PLANS.filter((p) => p.forRole === role || p.forRole === "both");
  const [planType, setPlanType] = useState(plans[0]?.id || "");
  const [payerNumber, setPayerNumber] = useState("");
  const [payerName, setPayerName] = useState("");
  const [requests, setRequests] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  const [platform, setPlatform] = useState<PlatformMomo>({
    code: "8787",
    name: "Kotaana",
    instructions: "",
  });

  async function load() {
    try {
      const [momo, list, plat] = await Promise.all([
        apiGet<{ momoNumber: string | null; momoName: string | null }>("/api/profile/momo"),
        apiGet<{ requests: any[] }>("/api/payments/momo"),
        apiGet<PlatformMomo>("/api/platform/momo").catch(() => null),
      ]);
      if (momo.momoNumber) setPayerNumber(momo.momoNumber);
      if (momo.momoName) setPayerName(momo.momoName);
      setRequests(list.requests || []);
      if (plat?.code) setPlatform(plat);
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function saveMomo() {
    if (!payerNumber || !payerName) {
      toast.error("Enter MoMo number and name");
      return;
    }
    await apiPatch("/api/profile/momo", { momoNumber: payerNumber, momoName: payerName });
    toast.success("Saved — used automatically when you buy a plan");
  }

  async function submitPay() {
    if (!payerNumber || !payerName || !planType) {
      toast.error("Plan, MoMo number and name are required");
      return;
    }
    setBusy(true);
    try {
      await apiPost("/api/payments/momo", {
        planType,
        payerNumber,
        payerName,
        note: `Paid to ${platform.code} (${platform.name})`,
      });
      toast.success("Pending order sent for approval. Check Notifications when approved.");
      await load();
    } catch (e: any) {
      toast.error(e?.message || "Failed");
    } finally {
      setBusy(false);
    }
  }

  const selected: PlanOption | undefined = plans.find((p) => p.id === planType);
  const pending = requests.filter((r) => r.status === "pending");
  const done = requests.filter((r) => r.status !== "pending");

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5">
        <h2 className="text-lg font-semibold">Buy with MoMo</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Pay the platform (owner). Details below are set by the app owner.
        </p>
        <div className="mt-3 rounded-xl bg-background/80 border border-border px-4 py-3">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Send MoMo to</div>
          <div className="text-2xl font-bold tracking-widest mt-0.5">{platform.code}</div>
          <div className="text-sm font-medium">{platform.name}</div>
          {platform.instructions && (
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{platform.instructions}</p>
          )}
        </div>
        <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
          <li>Send money to the code above</li>
          <li>Choose a plan and confirm your MoMo number + name</li>
          <li>Submit — owner approves → you get access + receipt in Notifications</li>
        </ol>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Your MoMo (payer identity)</label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            className="flex-1 rounded-xl border border-input bg-background px-3 py-2 text-sm"
            placeholder="Your MoMo number"
            value={payerNumber}
            onChange={(e) => setPayerNumber(e.target.value)}
          />
          <input
            className="flex-1 rounded-xl border border-input bg-background px-3 py-2 text-sm"
            placeholder="Name on MoMo"
            value={payerName}
            onChange={(e) => setPayerName(e.target.value)}
          />
          <button
            type="button"
            onClick={saveMomo}
            className="rounded-xl border border-border px-3 py-2 text-sm hover:bg-muted"
          >
            Save
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Plan</label>
        <div className="grid gap-2 sm:grid-cols-2">
          {plans.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPlanType(p.id)}
              className={`rounded-xl border px-3 py-3 text-left text-sm ${
                planType === p.id ? "border-primary bg-primary/10" : "border-border"
              }`}
            >
              <div className="font-medium">{p.label}</div>
              <div className="text-xs text-muted-foreground">{p.amountLabel}</div>
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        disabled={busy}
        onClick={submitPay}
        className="w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
      >
        {busy ? "Sending…" : selected ? `I paid — submit ${selected.label}` : "I paid — submit"}
      </button>

      {pending.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-2">Pending</h3>
          <ul className="space-y-1 text-sm text-muted-foreground">
            {pending.map((r) => (
              <li key={r.id} className="rounded-lg border border-border px-3 py-2">
                {r.planType || r.plan_type} · {r.status}
              </li>
            ))}
          </ul>
        </div>
      )}
      {done.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-2">Recent</h3>
          <ul className="space-y-1 text-sm text-muted-foreground">
            {done.slice(0, 5).map((r) => (
              <li key={r.id} className="rounded-lg border border-border px-3 py-2">
                {r.planType || r.plan_type} · {r.status}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
