"use client";

import { useState } from "react";
import { Dumbbell, X, Play, Target, ListOrdered, Timer, Hash } from "lucide-react";

export type ExRef = {
  id: string;
  name: string;
  gif?: string | null;
  image?: string | null;
  steps?: string[];
  target?: string | null;
  equipment?: string | null;
  body_part?: string | null;
  muscle_group?: string | null;
  secondary_muscles?: string[];
};

export type PlanExercise = {
  name: string;
  sets?: number;
  reps_or_time?: string;
  rest_seconds?: number;
  notes?: string;
  phase?: string;
  progressionHint?: string;
  ref?: ExRef | null;
};

/** Clear, easy-to-read exercise row + full how-to sheet. */
export function ExerciseItem({ ex }: { ex: PlanExercise }) {
  const [open, setOpen] = useState(false);
  const [playing, setPlaying] = useState(false);
  const ref = ex.ref;
  const hasDemo = !!ref?.gif || !!ref?.image;
  const steps = (ref?.steps || []).filter(Boolean);
  const showGif = playing && !!ref?.gif;

  const setsLabel = ex.sets != null ? `${ex.sets} set${ex.sets === 1 ? "" : "s"}` : null;
  const repsLabel = ex.reps_or_time || null;
  const restLabel = ex.rest_seconds != null ? `${ex.rest_seconds}s rest` : null;

  return (
    <>
      <div className="rounded-xl border border-border/60 p-2.5 transition hover:border-primary/40">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => hasDemo && ref?.gif && setPlaying((v) => !v)}
            onMouseEnter={() => ref?.gif && setPlaying(true)}
            onMouseLeave={() => setPlaying(false)}
            aria-label={playing ? "Pause demo" : "Play demo"}
            className="group relative grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-lg bg-white"
          >
            {ref?.gif || ref?.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={showGif ? ref!.gif! : ref?.image || ref?.gif!}
                alt={ex.name}
                className="h-full w-full object-contain"
                loading="lazy"
              />
            ) : (
              <Dumbbell className="h-5 w-5 text-muted-foreground" />
            )}
            {hasDemo && ref?.gif && !playing && (
              <span className="absolute inset-0 grid place-items-center bg-black/20">
                <Play className="h-4 w-4 text-white drop-shadow" />
              </span>
            )}
          </button>

          <button type="button" onClick={() => setOpen(true)} className="min-w-0 flex-1 text-left">
            <div className="font-medium text-sm leading-snug">{ex.name}</div>
            <div className="mt-1 flex flex-wrap gap-1.5 text-[11px]">
              {setsLabel && (
                <span className="inline-flex items-center gap-0.5 rounded-md bg-muted px-1.5 py-0.5">
                  <Hash className="h-3 w-3" /> {setsLabel}
                </span>
              )}
              {repsLabel && (
                <span className="inline-flex items-center gap-0.5 rounded-md bg-muted px-1.5 py-0.5">
                  <ListOrdered className="h-3 w-3" /> {repsLabel}
                </span>
              )}
              {restLabel && (
                <span className="inline-flex items-center gap-0.5 rounded-md bg-muted px-1.5 py-0.5">
                  <Timer className="h-3 w-3" /> {restLabel}
                </span>
              )}
            </div>
            {ref?.target && (
              <div className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                <Target className="h-3 w-3" /> Works: {ref.target}
              </div>
            )}
            {ex.notes && <p className="mt-1 text-[11px] text-muted-foreground line-clamp-2">{ex.notes}</p>}
            <span className="mt-1 inline-block text-[11px] font-medium text-primary">How to do it →</span>
          </button>
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center" onClick={() => setOpen(false)}>
          <div
            className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-2xl border border-border bg-background p-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-lg font-semibold leading-snug">{ex.name}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Follow step by step · rest between sets</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="rounded-full p-1.5 hover:bg-muted" aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Plain-language prescription */}
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl bg-muted/60 px-2 py-3">
                <div className="text-[10px] uppercase text-muted-foreground">Sets</div>
                <div className="text-xl font-bold">{ex.sets ?? "—"}</div>
              </div>
              <div className="rounded-xl bg-muted/60 px-2 py-3">
                <div className="text-[10px] uppercase text-muted-foreground">Reps / time</div>
                <div className="text-sm font-bold leading-tight mt-1">{ex.reps_or_time ?? "—"}</div>
              </div>
              <div className="rounded-xl bg-muted/60 px-2 py-3">
                <div className="text-[10px] uppercase text-muted-foreground">Rest</div>
                <div className="text-xl font-bold">{ex.rest_seconds != null ? `${ex.rest_seconds}s` : "—"}</div>
              </div>
            </div>

            {ref?.target && (
              <p className="mt-3 text-sm">
                <span className="font-medium">Main muscles:</span> {ref.target}
                {ref.secondary_muscles?.length ? ` · also ${ref.secondary_muscles.join(", ")}` : ""}
              </p>
            )}
            {ref?.equipment && (
              <p className="text-sm text-muted-foreground">Equipment: {ref.equipment}</p>
            )}

            {(ref?.gif || ref?.image) && (
              <div className="mt-3 overflow-hidden rounded-xl bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={ref.gif || ref.image || ""} alt="" className="mx-auto max-h-56 object-contain" />
              </div>
            )}

            <div className="mt-4">
              <h4 className="text-sm font-semibold mb-2">How to do it</h4>
              {steps.length > 0 ? (
                <ol className="space-y-2">
                  {steps.map((s, i) => (
                    <li key={i} className="flex gap-2 text-sm leading-relaxed">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                        {i + 1}
                      </span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Move with control. Breathe out on the hard part. Stop if you feel sharp pain.
                </p>
              )}
            </div>

            {ex.notes && (
              <div className="mt-4 rounded-xl border border-border bg-muted/30 px-3 py-2 text-sm">
                <span className="font-medium">Coach note: </span>
                {ex.notes}
              </div>
            )}
            {ex.progressionHint && (
              <div className="mt-2 rounded-xl border border-primary/30 bg-primary/5 px-3 py-2 text-sm">
                <span className="font-medium">Next time: </span>
                {ex.progressionHint}
              </div>
            )}

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mt-5 w-full rounded-full bg-primary py-2.5 text-sm font-medium text-primary-foreground"
            >
              Got it — back to plan
            </button>
          </div>
        </div>
      )}
    </>
  );
}
