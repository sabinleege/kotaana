"use client";

import { useEffect, useState } from "react";
import { ShieldAlert, RefreshCw } from "lucide-react";
import { Panel } from "@/components/athlete/ui";
import { apiGet } from "@/lib/fetcher";

type Scores = {
  recovery: number;
  overtraining: string;
  nutrition: string;
  sleep: string;
  hydration: string;
  overall: number;
  flags: string[];
};

export function RiskScoreCard() {
  const [scores, setScores] = useState<Scores | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const data = await apiGet<{ scores: Scores }>("/api/ai/risk");
      setScores(data.scores);
    } catch {
      setScores(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const tone =
    scores && scores.overall >= 70 ? "text-emerald-600" : scores && scores.overall >= 45 ? "text-amber-600" : "text-red-600";

  return (
    <Panel className="p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold">Health risk</h2>
        </div>
        <button type="button" onClick={load} className="rounded-full p-1.5 text-muted-foreground hover:bg-muted" title="Refresh">
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>
      {loading && !scores ? (
        <div className="mt-3 h-16 animate-pulse rounded-xl bg-muted/40" />
      ) : !scores ? (
        <p className="mt-2 text-xs text-muted-foreground">Risk engine unavailable. Check AI limits or try later.</p>
      ) : (
        <>
          <div className="mt-3 flex items-end gap-2">
            <span className={`text-3xl font-bold ${tone}`}>{scores.overall}</span>
            <span className="pb-1 text-xs text-muted-foreground">/ 100 overall</span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-lg bg-muted/40 px-2 py-1.5">Recovery <strong className="float-right">{scores.recovery}</strong></div>
            <div className="rounded-lg bg-muted/40 px-2 py-1.5">Overtraining <strong className="float-right capitalize">{scores.overtraining}</strong></div>
            <div className="rounded-lg bg-muted/40 px-2 py-1.5">Nutrition <strong className="float-right capitalize">{scores.nutrition}</strong></div>
            <div className="rounded-lg bg-muted/40 px-2 py-1.5">Sleep <strong className="float-right capitalize">{scores.sleep}</strong></div>
            <div className="col-span-2 rounded-lg bg-muted/40 px-2 py-1.5">Hydration <strong className="float-right capitalize">{scores.hydration}</strong></div>
          </div>
          {scores.flags?.length > 0 && (
            <ul className="mt-2 space-y-1 text-[11px] text-muted-foreground">
              {scores.flags.slice(0, 4).map((f) => (
                <li key={f}>• {f}</li>
              ))}
            </ul>
          )}
        </>
      )}
    </Panel>
  );
}
