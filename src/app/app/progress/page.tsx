"use client";

import { useState } from "react";
import { useWeightHistory, useLogWeight, useActivity, useProfile } from "@/hooks/use-athlete-data";
import { Ring, StatTile, Panel } from "@/components/athlete/ui";
import { AreaTrend, Bars } from "@/components/athlete/charts";
import { bmi, bmr, tdee, goalProgress, bodyComposition } from "@/lib/metrics";
import { TrendingUp, Plus, Flame, Gauge, Percent } from "lucide-react";
import { MonthlyProgressCard } from "@/components/athlete/MonthlyProgressCard";

export default function ProgressPage() {
  const { data: profile } = useProfile();
  const { data: weights = [] } = useWeightHistory();
  const { data: activity = [] } = useActivity();
  const logWeight = useLogWeight();
  const [weight, setWeight] = useState("");

  const p: any = profile ?? {};
  const bmiRes = bmi(p.weight, p.height);
  const start = weights.length ? Number(weights[0].weight) : p.weight;
  const goal = goalProgress(start, p.weight, p.target_weight);
  const basal = bmr({ weightKg: p.weight, heightCm: p.height, age: p.age, gender: p.gender });
  const need = tdee({ weightKg: p.weight, heightCm: p.height, age: p.age, gender: p.gender, activityLevel: p.activity_level });
  const comp = bodyComposition({ weightKg: p.weight, heightCm: p.height, age: p.age, gender: p.gender, measuredPercent: p.body_fat });

  const weightData = weights.map((w) => ({ label: w.week_label, weight: Number(w.weight) }));
  const activityData = activity.slice().reverse().map((a) => ({ day: a.day, calories: a.calories }));

  function submit() {
    const w = Number(weight);
    if (!w) return;
    logWeight.mutate({ week_label: `W${weights.length + 1}`, weight: w }, { onSuccess: () => setWeight("") });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary"><TrendingUp className="h-5 w-5" /></span>
        <h1 className="text-3xl font-bold tracking-tight">Progress</h1>
      </div>

      <MonthlyProgressCard />

      {/* Body composition */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Panel className="flex items-center gap-4">
          <Ring value={bmiRes?.scale ?? 0} tone={bmiRes?.tone ?? "primary"} center={bmiRes ? bmiRes.value : "—"} sub="BMI" />
          <div>
            <div className="text-sm text-muted-foreground">Body Mass Index</div>
            <div className="text-lg font-semibold" style={{ color: bmiRes ? `var(--color-${bmiRes.tone})` : undefined }}>{bmiRes?.category ?? "—"}</div>
          </div>
        </Panel>
        <Panel className="flex items-center gap-4">
          <Ring value={goal ?? 0} tone="accent" center={`${goal != null ? Math.round(goal * 100) : 0}%`} sub="Goal" />
          <div>
            <div className="text-sm text-muted-foreground">Goal progress</div>
            <div className="text-lg font-semibold">{p.weight ?? "—"} → {p.target_weight ?? "—"} kg</div>
          </div>
        </Panel>
        <StatTile icon={Gauge} label="Basal metabolic rate" value={basal ? `${basal}` : "—"} hint="kcal/day at rest" tone="chart-2" />
        <StatTile icon={Flame} label="Daily calorie need" value={need ? `${need}` : "—"} hint="TDEE (with activity)" tone="chart-3" />
      </div>

      {/* Body composition */}
      <Panel title="Body composition">
        {comp ? (
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:gap-8">
            <Ring value={comp.fatPercent / 45} tone="chart-2" size={120} center={`${comp.fatPercent}%`} sub="body fat" />
            <div className="grid flex-1 gap-4 sm:grid-cols-3">
              <Metric label="Category" value={comp.category} />
              <Metric label="Fat mass" value={`${comp.fatMassKg} kg`} />
              <Metric label="Lean mass" value={`${comp.leanMassKg} kg`} />
            </div>
          </div>
        ) : (
          <div className="grid h-24 place-items-center text-center text-sm text-muted-foreground">
            Add your height, weight, age and gender in Profile to see body fat %.
          </div>
        )}
        {comp?.estimated && (
          <p className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Percent className="h-3.5 w-3.5" /> Estimated from BMI, age &amp; gender. Enter a measured value in Profile for accuracy.
          </p>
        )}
      </Panel>

      {/* Log weight */}
      <Panel title="Log today's weight">
        <div className="flex gap-2">
          <input
            type="number" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="Weight (kg)"
            className="flex-1 rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          <button onClick={submit} disabled={!weight || logWeight.isPending}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[image:var(--gradient-primary)] px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50">
            <Plus className="h-4 w-4" /> Log
          </button>
        </div>
      </Panel>

      <Panel title="Weight trend">
        {weightData.length ? <AreaTrend data={weightData} xKey="label" yKey="weight" unit="kg" height={260} />
          : <div className="grid h-52 place-items-center text-sm text-muted-foreground">No entries yet — log your weight above.</div>}
      </Panel>

      <Panel title="Calories burned — last 14 days">
        {activityData.length ? <Bars data={activityData} xKey="day" yKey="calories" unit="kcal" height={220} />
          : <div className="grid h-48 place-items-center text-sm text-muted-foreground">No activity yet.</div>}
      </Panel>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-muted/30 p-4 text-center">
      <div className="text-lg font-bold">{value}</div>
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}
