"use client";

/**
 * Owner → AI usage. What the AI router is costing and whether it is healthy.
 */

import { useCallback, useEffect, useState } from "react";
import { Sparkles, AlertTriangle, Timer, Gauge } from "lucide-react";
import { apiGet } from "@/lib/fetcher";
import {
  PageHead,
  Panel,
  MetricTile,
  Meter,
  RoleBadge,
  Empty,
  Loading,
  ErrorNote,
} from "@/components/owner/ui";

type Resp = {
  days: number;
  totalCalls: number;
  tokensIn: number;
  tokensOut: number;
  avgDurationMs: number;
  failed: number;
  successRate: number;
  byFunction: { name: string; calls: number; tokens: number }[];
  topUsers: { userId: string; calls: number; email: string; name: string | null; role: string }[];
  series: { date: string; count: number }[];
  recentErrors: {
    id: string;
    functionName: string;
    status: string;
    errorMessage: string | null;
    createdAt: string;
  }[];
};

const RANGES = [
  { days: 1, label: "24 hours" },
  { days: 7, label: "7 days" },
  { days: 30, label: "30 days" },
];

const fmt = (n: number) => n.toLocaleString();

export default function OwnerAiUsagePage() {
  const [days, setDays] = useState(7);
  const [d, setD] = useState<Resp | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setD(await apiGet<Resp>(`/api/owner/ai-usage?days=${days}`));
      setErr(null);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not load AI usage");
    }
  }, [days]);

  useEffect(() => {
    load();
  }, [load]);

  const peak = d ? Math.max(1, ...d.series.map((s) => s.count)) : 1;
  const topFn = d && d.byFunction.length ? d.byFunction[0].calls : 1;

  return (
    <div>
      <PageHead
        title="AI usage"
        subtitle="Calls, tokens and failures across the model router"
        right={
          <div className="flex gap-1">
            {RANGES.map((r) => (
              <button
                key={r.days}
                type="button"
                onClick={() => setDays(r.days)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                  days === r.days
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        }
      />

      {err && <ErrorNote message={err} />}
      {!d && !err && <Loading />}

      {d && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricTile label="Calls" value={fmt(d.totalCalls)} icon={Sparkles} />
            <MetricTile
              label="Success rate"
              value={`${d.successRate}%`}
              hint={d.failed ? `${fmt(d.failed)} failed` : "No failures"}
              icon={Gauge}
            />
            <MetricTile
              label="Tokens"
              value={fmt(d.tokensIn + d.tokensOut)}
              hint={`${fmt(d.tokensIn)} in · ${fmt(d.tokensOut)} out`}
            />
            <MetricTile
              label="Avg latency"
              value={d.avgDurationMs ? `${fmt(d.avgDurationMs)}ms` : "—"}
              icon={Timer}
            />
          </div>

          <Panel title="Calls per day" description={`Last ${d.days} day${d.days === 1 ? "" : "s"}`}>
            {d.series.every((s) => s.count === 0) ? (
              <Empty>No AI calls in this window.</Empty>
            ) : (
              <div className="flex h-40 items-end gap-1">
                {d.series.map((s) => (
                  <div key={s.date} className="group flex flex-1 flex-col items-center gap-1">
                    <div
                      className="w-full rounded-t bg-primary/80 transition group-hover:bg-primary"
                      style={{ height: `${Math.max(2, (s.count / peak) * 100)}%` }}
                      title={`${s.date}: ${s.count}`}
                    />
                    <span className="text-[10px] tabular-nums text-muted-foreground">
                      {s.date.slice(5)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Panel>

          <div className="grid gap-6 lg:grid-cols-2">
            <Panel title="By function" description="Which AI tasks are actually being used">
              {d.byFunction.length === 0 ? (
                <Empty>Nothing recorded yet.</Empty>
              ) : (
                <ul className="space-y-3">
                  {d.byFunction.slice(0, 12).map((f) => (
                    <li key={f.name} className="space-y-1.5">
                      <div className="flex items-baseline justify-between gap-3 text-sm">
                        <span className="font-mono text-xs">{f.name}</span>
                        <span className="shrink-0 font-semibold tabular-nums">{fmt(f.calls)}</span>
                      </div>
                      <Meter value={f.calls} max={topFn} />
                    </li>
                  ))}
                </ul>
              )}
            </Panel>

            <Panel title="Heaviest users" description="Top 10 by call volume">
              {d.topUsers.length === 0 ? (
                <Empty>Nothing recorded yet.</Empty>
              ) : (
                <ul className="space-y-2">
                  {d.topUsers.map((u) => (
                    <li
                      key={u.userId}
                      className="flex items-center justify-between gap-3 rounded-xl border border-border/60 px-3 py-2 text-sm"
                    >
                      <div className="min-w-0">
                        <div className="truncate font-medium">{u.name || u.email}</div>
                        <div className="truncate text-xs text-muted-foreground">{u.email}</div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <RoleBadge role={u.role} />
                        <span className="font-semibold tabular-nums">{fmt(u.calls)}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>

          <Panel
            title="Recent failures"
            description="Most recent non-success calls — the fastest read on a broken model id or missing key"
          >
            {d.recentErrors.length === 0 ? (
              <Empty>No failures in this window.</Empty>
            ) : (
              <ul className="space-y-2">
                {d.recentErrors.map((e) => (
                  <li
                    key={e.id}
                    className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm"
                  >
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline gap-2">
                        <span className="font-mono text-xs">{e.functionName}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(e.createdAt).toLocaleString()}
                        </span>
                      </div>
                      {e.errorMessage && (
                        <p className="mt-0.5 break-words text-xs text-muted-foreground">
                          {e.errorMessage}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      )}
    </div>
  );
}
