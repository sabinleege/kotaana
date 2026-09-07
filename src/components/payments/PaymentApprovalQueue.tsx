"use client";

import { useEffect, useState } from "react";
import { apiGet, apiPost } from "@/lib/fetcher";
import { toast } from "sonner";

type Tab = "pending" | "completed";

export function PaymentApprovalQueue({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  const [tab, setTab] = useState<Tab>("pending");
  const [requests, setRequests] = useState<any[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  async function load(t: Tab = tab) {
    const data = await apiGet<{ requests: any[] }>(`/api/payments/momo/approve?tab=${t}`).catch(() => ({
      requests: [],
    }));
    setRequests(data.requests || []);
  }

  useEffect(() => {
    load(tab);
  }, [tab]);

  async function act(id: string, action: "approve" | "reject") {
    setBusy(id);
    try {
      await apiPost("/api/payments/momo/approve", { paymentRequestId: id, action });
      toast.success(
        action === "approve"
          ? "Approved — receipt sent to user notifications"
          : "Rejected — user notified",
      );
      await load(tab);
    } catch (e: any) {
      toast.error(e?.message || "Failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>

      <div className="flex gap-2">
        {(["pending", "completed"] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-full px-4 py-1.5 text-xs font-medium capitalize ${
              tab === t ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {requests.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {tab === "pending" ? "No pending MoMo orders." : "No completed transactions yet."}
        </p>
      ) : (
        <ul className="space-y-3">
          {requests.map((r) => (
            <li key={r.id} className="rounded-2xl border border-border bg-card p-4 text-sm">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="font-medium">
                    {r.payerName} · {r.payerNumber}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {r.role} · {r.planType} · {r.amountLabel} · to {r.payToCode}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {new Date(r.createdAt).toLocaleString()} · ref {String(r.id).slice(0, 8)}
                  </div>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase ${
                    r.status === "approved"
                      ? "bg-emerald-500/15 text-emerald-700"
                      : r.status === "rejected"
                        ? "bg-red-500/15 text-red-700"
                        : "bg-amber-500/15 text-amber-700"
                  }`}
                >
                  {r.status}
                </span>
              </div>
              {tab === "pending" && r.status === "pending" && (
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
          ))}
        </ul>
      )}
    </div>
  );
}
