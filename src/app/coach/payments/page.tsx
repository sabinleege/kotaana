"use client";

import { useEffect, useState } from "react";
import { apiGet, apiPost } from "@/lib/fetcher";
import { toast } from "sonner";

type Req = {
  id: string;
  payerName: string;
  payerNumber: string;
  planType: string;
  amountLabel?: string;
  status: string;
  createdAt: string;
};

export default function CoachAthletePaymentsPage() {
  const [pending, setPending] = useState<Req[]>([]);
  const [recent, setRecent] = useState<Req[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  async function load() {
    const data = await apiGet<{ pending: Req[]; recent: Req[]; requests?: Req[] }>("/api/payments/momo/approve").catch(
      () => ({ pending: [], recent: [] }),
    );
    setPending(data.pending || data.requests || []);
    setRecent(data.recent || []);
  }

  useEffect(() => {
    load();
  }, []);

  async function act(id: string, action: "approve" | "reject") {
    setBusy(id);
    try {
      await apiPost("/api/payments/momo/approve", { paymentRequestId: id, action });
      toast.success(action === "approve" ? "Approved — athlete gets receipt in notifications" : "Rejected");
      await load();
    } catch (e: any) {
      toast.error(e?.message || "Failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Athlete MoMo approvals</h1>
        <p className="text-sm text-muted-foreground">
          Pending buy requests from athletes you manage. Approve after you confirm their MoMo transfer.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-amber-600">Pending ({pending.length})</h2>
        {pending.length === 0 ? (
          <p className="text-sm text-muted-foreground">No pending athlete payments.</p>
        ) : (
          <ul className="space-y-3">
            {pending.map((r) => (
              <li key={r.id} className="rounded-2xl border border-border bg-card p-4 text-sm">
                <div className="font-medium">
                  {r.payerName} · {r.payerNumber}
                </div>
                <div className="text-xs text-muted-foreground">
                  {r.planType} · {r.amountLabel} · {new Date(r.createdAt).toLocaleString()}
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    disabled={busy === r.id}
                    onClick={() => act(r.id, "approve")}
                    className="rounded-full bg-emerald-600 px-4 py-1.5 text-xs text-white"
                  >
                    Approve & send receipt
                  </button>
                  <button type="button" disabled={busy === r.id} onClick={() => act(r.id, "reject")} className="rounded-full border px-4 py-1.5 text-xs">
                    Reject
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Recent</h2>
        {recent.length === 0 ? (
          <p className="text-sm text-muted-foreground">No completed items.</p>
        ) : (
          <ul className="space-y-2">
            {recent.map((r) => (
              <li key={r.id} className="rounded-xl border border-border px-3 py-2 text-xs flex justify-between gap-2">
                <span>
                  {r.payerName} · {r.planType} · {r.amountLabel}
                </span>
                <span className={r.status === "approved" ? "text-emerald-600 font-semibold" : "text-red-600 font-semibold"}>
                  {r.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
