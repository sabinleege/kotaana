"use client";

/**
 * Owner metrics home — platform pulse only.
 */
import { useEffect, useState } from "react";

type Metrics = {
  users: number;
  athletes: number;
  coaches: number;
  owners: number;
  activeRelations: number;
  activeSubs: number;
  aiToday: number;
  aiMonth: number;
  workouts7d: number;
  checkins7d: number;
  injuriesActive: number;
  notifications7d: number;
  aiByFunction: { name: string; count: number }[];
  generatedAt?: string;
};

export default function OwnerMetricsPage() {
  const [m, setM] = useState<Metrics | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/owner/metrics")
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || "Failed");
        return r.json();
      })
      .then(setM)
      .catch((e) => setErr(e.message || "Error"));
  }, []);

  const cards = m
    ? [
        ["Total users", m.users],
        ["Athletes", m.athletes],
        ["Coaches", m.coaches],
        ["Owners", m.owners],
        ["Active coach↔athlete links", m.activeRelations],
        ["Active subscriptions", m.activeSubs],
        ["AI calls (24h)", m.aiToday],
        ["AI calls (month)", m.aiMonth],
        ["Workouts logged (7d)", m.workouts7d],
        ["Check-ins (7d)", m.checkins7d],
        ["Active injuries", m.injuriesActive],
        ["Notifications (7d)", m.notifications7d],
      ]
    : [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold">Platform metrics</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          App owner control view — what is going on across athletes and coaches.
        </p>
        {m?.generatedAt && (
          <p className="mt-1 text-xs text-muted-foreground">
            Updated {new Date(m.generatedAt).toLocaleString()}
          </p>
        )}
      </div>

      {err && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {err}
        </div>
      )}

      {!m && !err && <div className="h-32 animate-pulse rounded-2xl bg-muted/40" />}

      {m && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {cards.map(([label, value]) => (
              <div key={String(label)} className="rounded-2xl border border-border bg-card p-5">
                <div className="text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
                <div className="mt-2 text-3xl font-bold">{value}</div>
              </div>
            ))}
          </div>

          <section className="rounded-2xl border border-border bg-card p-5">
            <h2 className="text-lg font-semibold">AI usage by function (this month)</h2>
            {m.aiByFunction.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">No AI calls yet.</p>
            ) : (
              <ul className="mt-4 space-y-2">
                {m.aiByFunction
                  .slice()
                  .sort((a, b) => b.count - a.count)
                  .map((row) => (
                    <li
                      key={row.name}
                      className="flex items-center justify-between rounded-xl border border-border/60 px-3 py-2 text-sm"
                    >
                      <span className="font-mono text-xs">{row.name}</span>
                      <span className="font-semibold">{row.count}</span>
                    </li>
                  ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
