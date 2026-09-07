"use client";

import { useEffect, useState } from "react";
import { Target, Sparkles } from "lucide-react";
import { Panel } from "@/components/athlete/ui";
import { apiGet, apiPost } from "@/lib/fetcher";

type GoalPlan = {
  goal: string;
  timelineWeeks: number;
  dailyCalories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  sessionsPerWeek: number;
  milestones: { week: number; target: string }[];
  risks: string[];
  notes: string;
};

export default function GoalsPage() {
  const [plan, setPlan] = useState<GoalPlan | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    const data = await apiGet<{ plan: GoalPlan | null }>("/api/ai/goal-plan").catch(() => ({ plan: null }));
    setPlan(data.plan);
  }

  async function generate() {
    setBusy(true);
    try {
      const data = await apiPost<{ plan: GoalPlan }>("/api/ai/goal-plan", {});
      setPlan(data.plan);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Target className="h-6 w-6 text-primary" /> Goal planner
          </h1>
          <p className="text-sm text-muted-foreground">Calories, protein, sessions, and milestones from your profile.</p>
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={generate}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          <Sparkles className="h-4 w-4" /> {busy ? "Generating…" : plan ? "Regenerate" : "Generate plan"}
        </button>
      </div>

      {!plan ? (
        <Panel className="p-6 text-sm text-muted-foreground">No plan yet. Generate one to see targets and milestones.</Panel>
      ) : (
        <>
          <Panel className="p-5 space-y-3">
            <h2 className="font-semibold">{plan.goal}</h2>
            <p className="text-sm text-muted-foreground">{plan.notes}</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[
                ["Daily calories", plan.dailyCalories],
                ["Protein (g)", plan.proteinG],
                ["Carbs (g)", plan.carbsG],
                ["Fat (g)", plan.fatG],
                ["Sessions / week", plan.sessionsPerWeek],
                ["Timeline (weeks)", plan.timelineWeeks],
              ].map(([l, v]) => (
                <div key={String(l)} className="rounded-xl border border-border px-3 py-2">
                  <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{l}</div>
                  <div className="text-xl font-bold">{v}</div>
                </div>
              ))}
            </div>
          </Panel>
          <Panel className="p-5">
            <h3 className="font-semibold">Milestones</h3>
            <ul className="mt-3 space-y-2">
              {(plan.milestones || []).map((m) => (
                <li key={m.week} className="flex gap-3 rounded-xl border border-border px-3 py-2 text-sm">
                  <span className="font-mono text-xs text-primary">W{m.week}</span>
                  <span>{m.target}</span>
                </li>
              ))}
            </ul>
          </Panel>
          {(plan.risks || []).length > 0 && (
            <Panel className="p-5">
              <h3 className="font-semibold">Risks</h3>
              <ul className="mt-2 list-disc pl-5 text-sm text-muted-foreground">
                {plan.risks.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </Panel>
          )}
        </>
      )}
    </div>
  );
}
