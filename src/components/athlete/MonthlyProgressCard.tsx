"use client";

import { useEffect, useState } from "react";
import { CalendarRange, Sparkles } from "lucide-react";
import { Panel } from "@/components/athlete/ui";
import { apiGet, apiPost } from "@/lib/fetcher";

type Report = {
  id?: string;
  monthKey: string;
  summary?: string | null;
  metrics?: any;
  confidence?: number | null;
};

export function MonthlyProgressCard() {
  const [reports, setReports] = useState<Report[]>([]);
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      const data = await apiGet<{ reports: Report[] }>("/api/ai/monthly-progress");
      setReports(data.reports || []);
    } catch {
      setReports([]);
    }
  }

  async function generate() {
    setBusy(true);
    try {
      await apiPost("/api/ai/monthly-progress", {});
      await load();
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const latest = reports[0];

  return (
    <Panel className="p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <CalendarRange className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold">Monthly intelligence</h2>
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={generate}
          className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-[11px] hover:bg-muted disabled:opacity-50"
        >
          <Sparkles className="h-3 w-3" /> {busy ? "…" : "Generate this month"}
        </button>
      </div>
      {!latest ? (
        <p className="text-xs text-muted-foreground">No monthly report yet. Generate after logging weight, workouts, or photos.</p>
      ) : (
        <div className="space-y-2 text-xs">
          <div className="font-medium">{latest.monthKey}</div>
          <p className="text-muted-foreground leading-relaxed">{latest.summary}</p>
          {latest.metrics && (
            <div className="grid grid-cols-2 gap-2">
              {latest.metrics.weightDeltaKg != null && (
                <div className="rounded-lg bg-muted/40 px-2 py-1">Δ weight: {Number(latest.metrics.weightDeltaKg).toFixed(1)} kg</div>
              )}
              {latest.metrics.workoutsCount != null && (
                <div className="rounded-lg bg-muted/40 px-2 py-1">Workouts: {latest.metrics.workoutsCount}</div>
              )}
              {latest.metrics.adherence != null && (
                <div className="rounded-lg bg-muted/40 px-2 py-1">Adherence: {latest.metrics.adherence}%</div>
              )}
              {latest.confidence != null && (
                <div className="rounded-lg bg-muted/40 px-2 py-1">Confidence: {Math.round(Number(latest.confidence) * 100)}%</div>
              )}
            </div>
          )}
        </div>
      )}
    </Panel>
  );
}
