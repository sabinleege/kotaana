"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  useProfile, useWeightHistory, useWorkoutLogs, useActivity, useMealLog, useUpdateProfile, useMyInjuries, useRuns,
} from "@/hooks/use-athlete-data";
import { useConnections } from "@/hooks/use-connections";
import { Ring, StatTile, Panel } from "@/components/athlete/ui";
import { AreaTrend, Bars } from "@/components/athlete/charts";
import { DailyCheckin } from "@/components/athlete/DailyCheckin";
import { TodayWorkoutCard } from "@/components/athlete/TodayWorkoutCard";
import { RiskScoreCard } from "@/components/athlete/RiskScoreCard";
import { GoalPlanCard } from "@/components/athlete/GoalPlanCard";
import { bmi, tdee, goalProgress, macroTargets, bodyComposition } from "@/lib/metrics";
import {
  Scale, Flame, Percent, Activity as ActivityIcon, Droplets, Dumbbell, Apple, TrendingUp,
  ArrowRight, Minus, Plus, HeartPulse, UserCheck, Sparkles, ShieldAlert, Baby, Navigation,
} from "lucide-react";

export default function AthleteDashboard() {
  const { data: profile } = useProfile();
  const { data: weights = [] } = useWeightHistory();
  const { data: workouts = [] } = useWorkoutLogs();
  const { data: activity = [] } = useActivity();
  const today = new Date().toISOString().slice(0, 10);
  const { data: mealLog } = useMealLog(today);
  const { data: connections } = useConnections();
  const { data: injuries = [] } = useMyInjuries();
  const { data: runs = [] } = useRuns();
  const updateProfile = useUpdateProfile();

  const p: any = profile ?? {};
  const name = (p.full_name || "Athlete").split(" ")[0];

  const bmiRes = bmi(p.weight, p.height);
  const comp = bodyComposition({ weightKg: p.weight, heightCm: p.height, age: p.age, gender: p.gender, measuredPercent: p.body_fat });
  const activeInjuries = injuries.filter((i) => i.status !== "resolved");
  const calorieTarget = tdee({ weightKg: p.weight, heightCm: p.height, age: p.age, gender: p.gender, activityLevel: p.activity_level }) || p.daily_calories_target || 2150;
  const startWeight = weights.length ? Number(weights[0].weight) : p.weight;
  const goal = goalProgress(startWeight, p.weight, p.target_weight);

  const caloriesToday = mealLog?.total_calories ?? 0;
  const proteinToday = mealLog?.total_protein ?? 0;
  const macroGoal = macroTargets(calorieTarget);

  const adherence = useMemo(() => {
    if (!workouts.length) return 0;
    const recent = workouts.slice(0, 7);
    return Math.round((recent.reduce((s, w) => s + Number(w.completion_rate), 0) / recent.length) * 100);
  }, [workouts]);

  const streak = useMemo(() => {
    // consecutive recent days with a workout logged >= 50%
    let s = 0;
    for (const w of workouts) { if (Number(w.completion_rate) >= 0.5) s++; else break; }
    return s;
  }, [workouts]);

  const weightData = weights.map((w) => ({ label: w.week_label, weight: Number(w.weight) }));
  const activityData = activity.slice().reverse().map((a) => ({ day: a.day, calories: a.calories }));

  const water = p.water_glasses ?? 0;
  const waterTarget = p.water_target ?? 8;
  const setWater = (n: number) => updateProfile.mutate({ water_glasses: Math.max(0, n) });

  const coach = connections?.active?.[0]?.other;
  const todayStr = new Date().toISOString().slice(0, 10);
  const distanceToday = runs.filter((r) => r.date.slice(0, 10) === todayStr).reduce((a, r) => a + Number(r.distance_km), 0);
  const conditions: any[] = Array.isArray(p.health_conditions) ? p.health_conditions : [];

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Hi, {name} 👋</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <DailyCheckin />
          <Link href="/app/workout" className="inline-flex items-center gap-2 rounded-full bg-[image:var(--gradient-primary)] px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-[var(--glow-primary)] hover:opacity-90">
            <Sparkles className="h-4 w-4" /> Today's plan
          </Link>
        </div>
      </div>

      {/* Primary: today's AI workout */}
      <TodayWorkoutCard />

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <RiskScoreCard />
        <GoalPlanCard />
      </div>

      {/* Pregnancy / condition banner */}
      {(p.is_pregnant || conditions.length > 0) && (
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-accent/40 bg-accent/10 px-4 py-3 text-sm">
          {p.is_pregnant && <span className="inline-flex items-center gap-1.5 font-medium" style={{ color: "var(--color-accent)" }}><Baby className="h-4 w-4" /> Pregnancy mode — prenatal-safe plans</span>}
          {conditions.length > 0 && <span className="text-muted-foreground">Tracking: {conditions.map((c) => c.type).slice(0, 3).join(", ")}</span>}
          <Link href="/app/health" className="ml-auto inline-flex items-center gap-1 text-primary hover:underline">Manage <ArrowRight className="h-4 w-4" /></Link>
        </div>
      )}

      {/* Active-injury alert */}
      {activeInjuries.length > 0 && (
        <Link href="/app/health?tab=injuries" className="flex items-center gap-3 rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm transition hover:bg-destructive/15">
          <ShieldAlert className="h-5 w-5 shrink-0 text-destructive" />
          <span className="flex-1">
            <span className="font-medium text-destructive">{activeInjuries.length} active {activeInjuries.length === 1 ? "injury" : "injuries"}</span>
            <span className="text-muted-foreground"> — {activeInjuries.map((i) => i.body_part).slice(0, 3).join(", ")}. Your coach adapts your plan around these.</span>
          </span>
          <ArrowRight className="h-4 w-4 text-destructive" />
        </Link>
      )}

      {/* Hero metric rings */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Panel className="flex items-center gap-4">
          <Ring value={bmiRes?.scale ?? 0} tone={bmiRes?.tone ?? "primary"} center={bmiRes ? bmiRes.value : "—"} sub="BMI" />
          <div>
            <div className="text-sm text-muted-foreground">Body Mass Index</div>
            <div className="text-lg font-semibold" style={{ color: bmiRes ? `var(--color-${bmiRes.tone})` : undefined }}>
              {bmiRes?.category ?? "Add height & weight"}
            </div>
          </div>
        </Panel>

        <Panel className="flex items-center gap-4">
          <Ring value={goal ?? 0} tone="accent" center={`${goal != null ? Math.round(goal * 100) : 0}%`} sub="Goal" />
          <div>
            <div className="text-sm text-muted-foreground">To goal weight</div>
            <div className="text-lg font-semibold">{p.weight ?? "—"} → {p.target_weight ?? "—"} kg</div>
          </div>
        </Panel>

        <Panel className="flex items-center gap-4">
          <Ring value={caloriesToday / calorieTarget} tone="chart-2" center={caloriesToday} sub="kcal" />
          <div>
            <div className="text-sm text-muted-foreground">Calories today</div>
            <div className="text-lg font-semibold">of {calorieTarget}</div>
          </div>
        </Panel>

        <Panel className="flex items-center gap-4">
          <Ring value={adherence / 100} tone="primary" center={`${adherence}%`} sub="7-day" />
          <div>
            <div className="text-sm text-muted-foreground">Workout adherence</div>
            <div className="text-lg font-semibold">🔥 {streak}-day streak</div>
          </div>
        </Panel>
      </div>

      {/* Quick stats row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile icon={Scale} label="Weight" value={`${p.weight ?? "—"} kg`} hint={`Target ${p.target_weight ?? "—"} kg`} tone="primary" />
        <StatTile icon={Percent} label="Body fat" value={comp ? `${comp.fatPercent}%` : "—"} hint={comp ? comp.category + (comp.estimated ? " · est." : "") : "Add body stats"} tone="chart-2" />
        <StatTile icon={Flame} label="Fitness score" value={p.fitness_score ?? "—"} tone="accent" />
        <StatTile icon={HeartPulse} label="Recovery" value={p.recovery_score ?? "—"} tone="chart-3" />
      </div>

      {/* Weight trend + macros */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Weight trend" className="lg:col-span-2">
          {weightData.length ? (
            <AreaTrend data={weightData} xKey="label" yKey="weight" unit="kg" />
          ) : (
            <Empty icon={TrendingUp} msg="Log your weight in Progress to see your trend." />
          )}
        </Panel>

        <Panel title="Today's macros">
          <div className="space-y-4">
            <MacroBar label="Protein" value={proteinToday} target={macroGoal.protein} tone="var(--color-primary)" />
            <MacroBar label="Carbs (target)" value={0} target={macroGoal.carbs} tone="var(--color-accent)" />
            <MacroBar label="Fat (target)" value={0} target={macroGoal.fat} tone="var(--color-chart-2)" />
            <Link href="/app/nutrition" className="mt-2 inline-flex items-center gap-1 text-sm text-primary hover:underline">
              Log a meal <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </Panel>
      </div>

      {/* Activity + water + coach */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Calories burned — 14 days" className="lg:col-span-2">
          {activityData.length ? (
            <Bars data={activityData} xKey="day" yKey="calories" unit="kcal" />
          ) : (
            <Empty icon={ActivityIcon} msg="No activity logged yet." />
          )}
        </Panel>

        <div className="space-y-4">
          <Panel title="Water">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-2xl font-bold">
                <Droplets className="h-6 w-6 text-chart-3" style={{ color: "var(--color-chart-3)" }} />
                {water}<span className="text-base text-muted-foreground">/ {waterTarget}</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setWater(water - 1)} className="grid h-9 w-9 place-items-center rounded-xl border border-border hover:bg-accent/10"><Minus className="h-4 w-4" /></button>
                <button onClick={() => setWater(water + 1)} className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground hover:opacity-90"><Plus className="h-4 w-4" /></button>
              </div>
            </div>
            <div className="mt-3 flex gap-1">
              {Array.from({ length: waterTarget }).map((_, i) => (
                <div key={i} className={`h-2 flex-1 rounded-full ${i < water ? "bg-[color:var(--color-chart-3)]" : "bg-muted"}`} />
              ))}
            </div>
          </Panel>

          <Panel title="Your coach">
            {coach ? (
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-primary/20 text-sm font-semibold text-primary">
                  {(coach.full_name || "C").split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{coach.full_name || coach.email}</div>
                  <div className="flex items-center gap-1 text-xs text-primary"><UserCheck className="h-3 w-3" /> Following your progress</div>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-sm text-muted-foreground">Not connected to a coach yet.</p>
                <Link href="/app/settings" className="mt-2 inline-flex items-center gap-1 text-sm text-primary hover:underline">
                  Connect with a coach <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            )}
          </Panel>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <QuickAction href="/app/track" icon={Navigation} title="Track a run" sub={distanceToday > 0 ? `${distanceToday.toFixed(2)} km today` : "GPS distance"} />
        <QuickAction href="/app/workout" icon={Dumbbell} title="Workout" sub="Plan & log sessions" />
        <QuickAction href="/app/nutrition" icon={Apple} title="Nutrition" sub="Snap or log meals" />
        <QuickAction href="/app/progress" icon={TrendingUp} title="Progress" sub="Weight & body comp" />
      </div>
    </div>
  );
}

function MacroBar({ label, value, target, tone }: { label: string; value: number; target: number; tone: string }) {
  const pct = target ? Math.min(100, (value / target) * 100) : 0;
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{value} / {target} g</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: tone }} />
      </div>
    </div>
  );
}

function QuickAction({ href, icon: Icon, title, sub }: { href: string; icon: any; title: string; sub: string }) {
  return (
    <Link href={href} className="group flex items-center gap-3 rounded-3xl border border-border/70 bg-card p-5 transition hover:border-primary/40 hover:shadow-[var(--glow-primary)]">
      <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="font-medium">{title}</div>
        <div className="text-xs text-muted-foreground">{sub}</div>
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-primary" />
    </Link>
  );
}

function Empty({ icon: Icon, msg }: { icon: any; msg: string }) {
  return (
    <div className="grid h-52 place-items-center text-center">
      <div>
        <Icon className="mx-auto h-8 w-8 text-muted-foreground/60" />
        <p className="mt-2 text-sm text-muted-foreground">{msg}</p>
      </div>
    </div>
  );
}
