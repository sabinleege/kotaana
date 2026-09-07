"use client";

import { useState } from "react";
import { apiPost } from "@/lib/fetcher";
import { Panel } from "@/components/athlete/ui";

type Injury = {
  id: string;
  bodyPart: string;
  injuryType: string;
  severity: number;
  status: string;
  dateReported?: string;
  expectedReturn?: string | null;
  restrictions?: string | null;
  healingPercent?: number | null;
};

export function InjuryTimelineCard({ injury }: { injury: Injury }) {
  const [timeline, setTimeline] = useState<any[] | null>(null);
  const [current, setCurrent] = useState<any | null>(null);
  const [busy, setBusy] = useState(false);

  async function build() {
    setBusy(true);
    try {
      const data = await apiPost<{ injury: any; currentWeek: any }>("/api/injuries/timeline", {
        injuryId: injury.id,
      });
      setTimeline((data.injury?.recoveryTimeline as any[]) || []);
      setCurrent(data.currentWeek);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Panel className="p-4 space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="font-semibold text-sm">
            {injury.bodyPart} — {injury.injuryType}
          </div>
          <div className="text-[11px] text-muted-foreground">
            Severity {injury.severity}/5 · {injury.status}
            {injury.expectedReturn ? ` · return ~${String(injury.expectedReturn).slice(0, 10)}` : ""}
          </div>
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={build}
          className="rounded-full border border-border px-3 py-1 text-xs hover:bg-muted disabled:opacity-50"
        >
          {busy ? "Building…" : timeline ? "Refresh timeline" : "Build timeline"}
        </button>
      </div>
      {injury.restrictions && <p className="text-xs text-amber-700 dark:text-amber-400">Restriction: {injury.restrictions}</p>}
      {current && (
        <div className="rounded-lg bg-primary/10 px-3 py-2 text-xs">
          <strong>This phase (week {current.week}):</strong> {current.focus}
          <div className="mt-1 text-muted-foreground">{current.restrictions}</div>
        </div>
      )}
      {timeline && timeline.length > 0 && (
        <ol className="max-h-40 space-y-1 overflow-y-auto text-[11px] text-muted-foreground">
          {timeline.slice(0, 12).map((w) => (
            <li key={w.week}>
              W{w.week}: {w.focus}
            </li>
          ))}
        </ol>
      )}
    </Panel>
  );
}
