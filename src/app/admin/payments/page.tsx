"use client";

import { useEffect, useState } from "react";
import { apiGet, apiPost } from "@/lib/fetcher";
import { toast } from "sonner";

type Req = {
  id: string;
  payerName: string;
  payerNumber: string;
  role: string;
  planType: string;
  amountLabel?: string;
  payToCode?: string;
  status: string;
  createdAt: string;
};

export default function AdminPaymentsPage() {
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
      toast.success(action === "approve" ? "Approved — receipt sent in notification" : "Rejected — user notified");
      await load();
    } catch (e: any) {
      toast.error(e?.message || "Failed");
    } finally {
      setBusy(null);
    }
  }

  function Card({ r, actions }: { r: Req; actions?: boolean }) {
    return (
      <li className="rounded-2xl border border-border bg-card p-4 text-sm">
        <div className="font-medium">
          {r.payerName} · {r.payerNumber}
        </div>
        <div className="text-xs text-muted-foreground">
          {r.role} · {r.planType} · {r.amountLabel} · to {r.payToCode || "8787"} · {new Date(r.createdAt).toLocaleString()}
        </div>
        <div className="mt-1 text-[11px] uppercase tracking-wide text-muted-foreground">Status: {r.status}</div>
        {actions && (
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              disabled={busy === r.id}
              onClick={() => act(r.id, "approve")}
              className="rounded-full bg-emerald-600 px-4 py-1.5 text-xs text-white disabled:opacity-50"
            >
              Approve & send receipt
            </button>
            <button
              type="button"
              disabled={busy === r.id}
              onClick={() => act(r.id, "reject")}
              className="rounded-full border border-border px-4 py-1.5 text-xs disabled:opacity-50"
            >
              Reject
            </button>
          </div>
        )}
      </li>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">MoMo approvals</h1>
        <p className="text-sm text-muted-foreground">
          Users pay <strong>8787</strong> then click buy. Match name + number, approve — they get a receipt notification and plan access.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-amber-600">Pending ({pending.length})</h2>
        {pending.length === 0 ? (
          <p className="text-sm text-muted-foreground">No pending orders.</p>
        ) : (
          <ul className="space-y-3">
            {pending.map((r) => (
              <Card key={r.id} r={r} actions />
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Completed / rejected</h2>
        {recent.length === 0 ? (
          <p className="text-sm text-muted-foreground">No completed transactions yet.</p>
        ) : (
          <ul className="space-y-3">
            {recent.map((r) => (
              <Card key={r.id} r={r} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
