"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Target, Sparkles } from "lucide-react";
import { Panel } from "@/components/athlete/ui";
import { apiGet, apiPost } from "@/lib/fetcher";

type GoalPlan = {
  goal: string;
  timelineWeeks: number;
  dailyCalories: number;
  proteinG: number;
  sessionsPerWeek: number;
  milestones?: { week: number; target: string }[];
  risks?: string[];
};

export function GoalPlanCard() {
  const [plan, setPlan] = useState<GoalPlan | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      const data = await apiGet<{ plan: GoalPlan | null }>("/api/ai/goal-plan");
      setPlan(data.plan);
    } catch {
      setPlan(null);
    }
  }

  async function generate() {
    setBusy(true);
    try {
      const data = await apiPost<{ plan: GoalPlan }>("/api/ai/goal-plan", {});
      setPlan(data.plan);
    } catch {
      /* toast optional */
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <Panel className="p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold">Goal plan</h2>
        </div>
        <Link href="/app/goals" className="text-[11px] text-primary hover:underline">
          Details
        </Link>
      </div>
      {!plan ? (
        <div className="mt-3 space-y-2">
          <p className="text-xs text-muted-foreground">No plan yet. Generate from your profile goals.</p>
          <button
            type="button"
            disabled={busy}
            onClick={generate}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-50"
          >
            <Sparkles className="h-3.5 w-3.5" /> {busy ? "Planning…" : "Generate plan"}
          </button>
        </div>
      ) : (
        <div className="mt-3 space-y-2 text-xs">
          <p className="font-medium">{plan.goal}</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg bg-muted/40 px-2 py-1.5">{plan.dailyCalories} kcal/day</div>
            <div className="rounded-lg bg-muted/40 px-2 py-1.5">{plan.proteinG}g protein</div>
            <div className="rounded-lg bg-muted/40 px-2 py-1.5">{plan.sessionsPerWeek}× / week</div>
            <div className="rounded-lg bg-muted/40 px-2 py-1.5">{plan.timelineWeeks} weeks</div>
          </div>
          {plan.milestones?.[0] && (
            <p className="text-muted-foreground">Next: week {plan.milestones[0].week} — {plan.milestones[0].target}</p>
          )}
          <button type="button" disabled={busy} onClick={generate} className="text-[11px] text-primary hover:underline disabled:opacity-50">
            {busy ? "Updating…" : "Regenerate"}
          </button>
        </div>
      )}
    </Panel>
  );
}
