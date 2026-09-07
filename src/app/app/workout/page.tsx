"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useWorkoutLogs } from "@/hooks/use-athlete-data";
import { apiPost } from "@/lib/fetcher";
import { Dumbbell, Loader2, Sparkles } from "lucide-react";
import { ExerciseItem, type PlanExercise } from "@/components/athlete/ExerciseItem";

type PlanDay = { day_name: string; focus: string; duration_min?: number; exercises: PlanExercise[] };
type Plan = { summary: string; safetyNote?: string; days: PlanDay[] };

export default function WorkoutPage() {
  const qc = useQueryClient();
  const { data: logs = [] } = useWorkoutLogs();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [generating, setGenerating] = useState(false);

  async function generate() {
    setGenerating(true);
    try {
      const res = await apiPost<{ plan: Plan }>("/api/ai/workout", {});
      setPlan(res.plan);
      toast.success("Plan generated");
    } catch (e: any) {
      toast.error(e.message || "Could not generate plan");
    } finally {
      setGenerating(false);
    }
  }

  async function logToday(rate: number) {
    try {
      await apiPost("/api/workout-logs", { date: new Date().toISOString().slice(0, 10), completion_rate: rate });
      toast.success("Workout logged");
      qc.invalidateQueries({ queryKey: ["workout-logs"] });
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
            <Dumbbell className="h-5 w-5" />
          </span>
          <h1 className="text-3xl font-semibold">Workout</h1>
        </div>
        <button
          onClick={generate} disabled={generating}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Generate AI plan
        </button>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="text-sm font-semibold">Log today's session</div>
        <div className="mt-3 flex flex-wrap gap-2">
          {[
            { label: "Skipped", rate: 0 },
            { label: "Partial (50%)", rate: 0.5 },
            { label: "Completed", rate: 1 },
          ].map((o) => (
            <button key={o.label} onClick={() => logToday(o.rate)} className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-accent/10">
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {plan && (
        <div className="mt-6 rounded-2xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold">Your AI plan</h2>
          <p className="mt-1 text-sm text-muted-foreground">{plan.summary}</p>
          {plan.safetyNote && (
            <p className="mt-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{plan.safetyNote}</p>
          )}
          <div className="mt-4 grid gap-3">
            {plan.days.map((d, i) => (
              <div key={i} className="rounded-xl border border-border p-4">
                <div className="flex items-center justify-between">
                  <div className="font-medium">{d.day_name} · {d.focus}</div>
                  {d.duration_min ? <span className="text-xs text-muted-foreground">{d.duration_min} min</span> : null}
                </div>
                <div className="mt-3 grid gap-2">
                  {d.exercises?.map((ex, j) => <ExerciseItem key={j} ex={ex} />)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 rounded-2xl border border-border bg-card p-6">
        <h2 className="mb-3 text-lg font-semibold">Recent sessions</h2>
        {logs.length === 0 ? (
          <div className="text-sm text-muted-foreground">No workouts logged yet.</div>
        ) : (
          <ul className="divide-y divide-border">
            {logs.map((w) => (
              <li key={w.id} className="flex items-center justify-between py-2.5">
                <span className="text-sm">{new Date(w.date).toLocaleDateString()}</span>
                <span className="text-sm font-medium text-primary">{Math.round(Number(w.completion_rate) * 100)}%</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
