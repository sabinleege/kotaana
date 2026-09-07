"use client";

import { useEffect, useState } from "react";

type Row = {
  athleteId: string;
  name: string;
  status: string;
  readiness?: number | null;
  adherence?: number | null;
  injuries?: number;
  lastCheckin?: string | null;
  lastWorkout?: string | null;
  aiFlag?: string;
};

export default function CoachStatisticsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [filter, setFilter] = useState<"all" | "risk" | "injured" | "inactive">("all");

  useEffect(() => {
    fetch("/api/coach/athletes?detailed=1")
      .then((r) => r.json())
      .then((d) => setRows(d.athletes || []))
      .catch(() => setRows([]));
  }, []);

  const view = rows.filter((r) => {
    if (filter === "injured") return (r.injuries ?? 0) > 0;
    if (filter === "risk") return r.aiFlag === "risk" || r.aiFlag === "warn";
    if (filter === "inactive") return r.status === "paused";
    return true;
  });

  const totals = {
    n: rows.length,
    injured: rows.filter((r) => (r.injuries ?? 0) > 0).length,
    risk: rows.filter((r) => r.aiFlag === "risk" || r.aiFlag === "warn").length,
    adherence:
      rows.length && rows.some((r) => r.adherence != null)
        ? Math.round(
            rows.filter((r) => r.adherence != null).reduce((s, r) => s + (r.adherence || 0), 0) /
              rows.filter((r) => r.adherence != null).length,
          )
        : null,
  };

  return (
    <div>
      <h1 className="text-3xl font-semibold">Statistics</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Numbers for every athlete under management.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-4">
        {[
          ["Athletes", totals.n],
          ["Injured", totals.injured],
          ["At risk", totals.risk],
          ["Avg adherence", totals.adherence != null ? `${totals.adherence}%` : "—"],
        ].map(([k, v]) => (
          <div key={k as string} className="rounded-xl border border-border bg-card p-4">
            <div className="text-xs uppercase text-muted-foreground">{k}</div>
            <div className="mt-1 text-2xl font-bold">{v}</div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex gap-2">
        {(["all", "risk", "injured", "inactive"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1 text-xs ${
              filter === f ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="p-3">Athlete</th>
              <th className="p-3">Status</th>
              <th className="p-3">Readiness</th>
              <th className="p-3">Adherence</th>
              <th className="p-3">Injuries</th>
              <th className="p-3">Last check-in</th>
              <th className="p-3">Last workout</th>
              <th className="p-3">AI flag</th>
            </tr>
          </thead>
          <tbody>
            {view.map((r) => (
              <tr key={r.athleteId} className="border-t border-border">
                <td className="p-3 font-medium">{r.name}</td>
                <td className="p-3">{r.status}</td>
                <td className="p-3">{r.readiness ?? "—"}</td>
                <td className="p-3">{r.adherence != null ? `${Math.round(r.adherence)}%` : "—"}</td>
                <td className="p-3">{r.injuries ?? 0}</td>
                <td className="p-3 text-muted-foreground">
                  {r.lastCheckin ? new Date(r.lastCheckin).toLocaleDateString() : "—"}
                </td>
                <td className="p-3 text-muted-foreground">
                  {r.lastWorkout ? new Date(r.lastWorkout).toLocaleDateString() : "—"}
                </td>
                <td className="p-3">{r.aiFlag || "ok"}</td>
              </tr>
            ))}
            {view.length === 0 && (
              <tr>
                <td colSpan={8} className="p-6 text-center text-muted-foreground">
                  No rows
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
