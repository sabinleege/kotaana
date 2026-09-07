"use client";

/**
 * Owner → System. Is this deployment actually wired up?
 * Shows whether each integration is configured — never the value it is configured with.
 */

import { useCallback, useEffect, useState } from "react";
import { Database, ServerCog, Wallet } from "lucide-react";
import { apiGet } from "@/lib/fetcher";
import {
  PageHead,
  Panel,
  MetricTile,
  StatusDot,
  Loading,
  ErrorNote,
} from "@/components/owner/ui";

type ConfigItem = { key: string; label: string; ok: boolean; required: boolean };

type Resp = {
  runtime: {
    env: string;
    node: string;
    storage: string;
    aiConfigured: boolean;
    generatedAt: string;
  };
  database: { ok: boolean; latencyMs: number; error: string | null };
  config: { group: string; items: ConfigItem[] }[];
  tables: { name: string; rows: number }[];
  attention: { pendingPayments: number };
};

export default function OwnerSystemPage() {
  const [d, setD] = useState<Resp | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setD(await apiGet<Resp>("/api/owner/system"));
      setErr(null);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not load system status");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const missingRequired =
    d?.config.flatMap((g) => g.items).filter((i) => i.required && !i.ok) ?? [];

  return (
    <div>
      <PageHead
        title="System"
        subtitle="Deployment health and integration status"
        right={
          <button
            type="button"
            onClick={load}
            className="rounded-xl border border-border px-3 py-1.5 text-sm hover:bg-accent/10"
          >
            Refresh
          </button>
        }
      />

      {err && <ErrorNote message={err} />}
      {!d && !err && <Loading />}

      {d && (
        <div className="space-y-6">
          {missingRequired.length > 0 && (
            <ErrorNote
              message={`Missing required configuration: ${missingRequired
                .map((i) => i.key)
                .join(", ")}. The app cannot serve requests without these.`}
            />
          )}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricTile
              label="Database"
              value={d.database.ok ? "Connected" : "Down"}
              hint={d.database.ok ? `${d.database.latencyMs}ms round-trip` : d.database.error ?? ""}
              icon={Database}
            />
            <MetricTile label="Environment" value={d.runtime.env} icon={ServerCog} />
            <MetricTile label="Storage" value={d.runtime.storage} />
            <MetricTile
              label="Pending payments"
              value={d.attention.pendingPayments}
              hint={d.attention.pendingPayments ? "Waiting on your approval" : "Nothing waiting"}
              icon={Wallet}
            />
          </div>

          <Panel
            title="Configuration"
            description="Whether each integration has been set. Values are never shown here."
          >
            <div className="grid gap-6 sm:grid-cols-2">
              {d.config.map((g) => (
                <div key={g.group}>
                  <h3 className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">
                    {g.group}
                  </h3>
                  <ul className="space-y-1.5">
                    {g.items.map((i) => (
                      <li key={i.key} className="flex items-center gap-2.5 text-sm">
                        <StatusDot ok={i.ok} />
                        <span className={i.ok ? "" : "text-muted-foreground"}>{i.label}</span>
                        {i.required && !i.ok && (
                          <span className="ml-auto text-xs font-medium text-destructive">
                            required
                          </span>
                        )}
                        {!i.required && !i.ok && (
                          <span className="ml-auto text-xs text-muted-foreground">optional</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Data" description="Row counts across the main tables">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[420px] text-sm">
                <tbody>
                  {d.tables.map((t) => (
                    <tr key={t.name} className="border-b border-border/50 last:border-0">
                      <td className="py-2 font-mono text-xs text-muted-foreground">{t.name}</td>
                      <td className="py-2 text-right font-semibold tabular-nums">
                        {t.rows.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          <p className="text-xs text-muted-foreground">
            Node {d.runtime.node} · checked {new Date(d.runtime.generatedAt).toLocaleString()}
          </p>
        </div>
      )}
    </div>
  );
}
