"use client";

import { useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost } from "@/lib/fetcher";
import { toast } from "sonner";
import { Panel } from "@/components/athlete/ui";
import { Dumbbell, RefreshCw, Pause, Clock } from "lucide-react";
import { ExerciseItem } from "@/components/athlete/ExerciseItem";

type Block = {
  phase: string;
  exerciseId?: string;
  name: string;
  sets?: number;
  reps?: string;
  restSec?: number;
  notes?: string;
  gif?: string | null;
  steps?: string[];
  target?: string | null;
  highlightBreak?: boolean;
  progressionHint?: string;
};

type Session = {
  dayKey: string;
  title: string;
  focus: string;
  track?: string;
  ageBand?: string;
  level?: string;
  playbookNote?: string;
  blocks: Block[];
};

/** Estimate total session minutes from sets, rest, and movement time. */
function estimateSessionMinutes(blocks: Block[]): number {
  let seconds = 0;
  for (const b of blocks) {
    if (b.phase === "break" || b.highlightBreak) {
      seconds += b.restSec ?? 60;
      continue;
    }
    const sets = Math.max(1, b.sets ?? 1);
    // ~3s per rep if range like 8-12 → use midpoint; default 10 reps × 3s
    let repsMid = 10;
    const m = (b.reps || "").match(/(\d+)\s*[-–]\s*(\d+)/);
    if (m) repsMid = Math.round((Number(m[1]) + Number(m[2])) / 2);
    else {
      const single = (b.reps || "").match(/(\d+)/);
      if (single) repsMid = Number(single[1]);
    }
    const workPerSet = Math.min(90, Math.max(20, repsMid * 3));
    const restBetween = b.restSec ?? 60;
    seconds += sets * workPerSet + Math.max(0, sets - 1) * restBetween;
    // small transition after exercise
    seconds += 15;
  }
  return Math.max(5, Math.round(seconds / 60));
}

export function TodayWorkoutCard() {
  const qc = useQueryClient();
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["daily-session"],
    queryFn: () => apiGet<{ session: Session }>("/api/ai/daily-session"),
    staleTime: 60_000,
  });

  const session = data?.session;
  const blocks = session?.blocks || [];
  const phaseLabel = (p: string) =>
    ({ warmup: "Warm-up", work: "Main work", break: "Break", finisher: "Finisher" } as Record<string, string>)[p] || p;

  const estMin = useMemo(() => estimateSessionMinutes(blocks), [blocks]);

  // Number only real exercises (not breaks) for display 1, 2, 3…
  let exerciseCounter = 0;

  async function logEffort(exerciseId: string | undefined, name: string, effort: "easy" | "ok" | "hard") {
    if (!exerciseId) return;
    try {
      await apiPost("/api/training/performance", { exerciseId, exerciseName: name, effort });
      toast.success(`Logged ${effort} — next plan can progress`);
    } catch {
      toast.error("Could not save effort");
    }
  }

  async function rebuild() {
    await apiPost("/api/ai/daily-session", {});
    await qc.invalidateQueries({ queryKey: ["daily-session"] });
    refetch();
  }

  return (
    <Panel className="p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Dumbbell className="h-4 w-4 text-primary shrink-0" />
            <span className="truncate">{session?.title || "Today’s workout"}</span>
          </h2>
          {blocks.length > 0 && (
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Clock className="h-3.5 w-3.5" />
              This session ≈ {estMin} minutes
            </div>
          )}
          <p className="text-xs text-muted-foreground mt-1.5">
            {session?.focus ? `Focus: ${session.focus}` : "From your daily report + exercise library"}
            {session?.dayKey ? ` · ${session.dayKey}` : ""}
            {session?.track ? ` · ${session.track}` : ""}
            {session?.level ? ` · ${session.level}` : ""}
          </p>
          {session?.playbookNote && (
            <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">{session.playbookNote}</p>
          )}
        </div>
        <button
          type="button"
          onClick={rebuild}
          disabled={isFetching}
          className="rounded-full border border-border p-2 text-muted-foreground hover:bg-muted disabled:opacity-50 shrink-0"
          title="Rebuild today’s session"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
        </button>
      </div>

      {isLoading && <div className="h-24 animate-pulse rounded-xl bg-muted/40" />}

      {!isLoading && blocks.length === 0 && (
        <div className="text-sm text-muted-foreground space-y-2">
          <p>No session yet for today. Generate from your daily report.</p>
          <button
            type="button"
            onClick={rebuild}
            className="rounded-full bg-primary px-4 py-2 text-xs font-medium text-primary-foreground"
          >
            Build today’s plan
          </button>
        </div>
      )}

      <ol className="space-y-2">
        {blocks.map((b, i) => {
          const isBreak = b.phase === "break" || b.highlightBreak;
          if (!isBreak) exerciseCounter += 1;
          const num = exerciseCounter;

          if (isBreak) {
            return (
              <li
                key={`break-${i}`}
                className="flex items-center gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-3 text-sm"
              >
                <Pause className="h-4 w-4 text-amber-600 shrink-0" />
                <div>
                  <div className="font-medium text-amber-800 dark:text-amber-200">{b.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {b.restSec ? `${b.restSec}s` : "Rest"} {b.notes ? `· ${b.notes}` : ""}
                  </div>
                </div>
              </li>
            );
          }

          return (
            <li key={`${b.exerciseId || b.name}-${i}`} className="rounded-xl border border-border px-2 py-1">
              <div className="flex items-center gap-2 px-1 pt-1">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                  {num}
                </span>
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{phaseLabel(b.phase)}</span>
              </div>
              <ExerciseItem
                ex={{
                  name: b.name,
                  sets: b.sets,
                  reps_or_time: b.reps,
                  rest_seconds: b.restSec,
                  notes: b.notes,
                  progressionHint: b.progressionHint,
                  ref: b.exerciseId
                    ? {
                        id: b.exerciseId,
                        name: b.name,
                        gif: b.gif,
                        steps: b.steps,
                        target: b.target,
                      }
                    : b.gif
                      ? { id: b.name, name: b.name, gif: b.gif, steps: b.steps, target: b.target }
                      : null,
                }}
              />
              {b.phase === "work" && b.exerciseId && (
                <div className="flex flex-wrap gap-1 px-2 pb-2">
                  <span className="text-[10px] text-muted-foreground mr-1 self-center">How was it?</span>
                  {(["easy", "ok", "hard"] as const).map((eff) => (
                    <button
                      key={eff}
                      type="button"
                      onClick={() => logEffort(b.exerciseId, b.name, eff)}
                      className="rounded-full border border-border px-2 py-0.5 text-[10px] hover:bg-muted capitalize"
                    >
                      {eff}
                    </button>
                  ))}
                </div>
              )}
            </li>
          );
        })}
      </ol>

      {blocks.length > 0 && (
        <p className="text-[11px] text-center text-muted-foreground pt-1">
          Follow in order 1 → {exerciseCounter}. Total about {estMin} minutes including rests.
        </p>
      )}
    </Panel>
  );
}
