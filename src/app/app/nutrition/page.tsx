"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useMealLog, useSaveMealLog, useProfile } from "@/hooks/use-athlete-data";
import { Ring, Panel } from "@/components/athlete/ui";
import { PhotoCapture } from "@/components/PhotoCapture";
import { apiPost, apiGet } from "@/lib/fetcher";
import { tdee, macroTargets } from "@/lib/metrics";
import { Apple, Plus, Trash2, Sparkles } from "lucide-react";

type MealItem = { id: string; slot: string; name: string; calories: number; protein: number };
const SLOTS = ["Breakfast", "Lunch", "Snack", "Dinner"];

export default function NutritionPage() {
  const today = new Date().toISOString().slice(0, 10);
  const { data: log } = useMealLog(today);
  const { data: profile } = useProfile();
  const save = useSaveMealLog();

  const [meals, setMeals] = useState<MealItem[]>([]);
  const [slot, setSlot] = useState("Breakfast");
  const [name, setName] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [weekStats, setWeekStats] = useState<{ adherence?: number; daysLogged?: number; proteinTarget?: number } | null>(null);

  useEffect(() => {
    apiGet<{ stats: any }>("/api/nutrition/stats")
      .then((d) => setWeekStats(d.stats))
      .catch(() => {});
  }, [log]);

  useEffect(() => { if (log?.meals) setMeals(log.meals as MealItem[]); }, [log]);

  const p: any = profile ?? {};
  const target = tdee({ weightKg: p.weight, heightCm: p.height, age: p.age, gender: p.gender, activityLevel: p.activity_level }) || p.daily_calories_target || 2150;
  const macroGoal = macroTargets(target);

  const totals = useMemo(
    () => meals.reduce((a, m) => ({ cal: a.cal + (m.calories || 0), pro: a.pro + (m.protein || 0) }), { cal: 0, pro: 0 }),
    [meals],
  );
  const remaining = Math.max(0, target - totals.cal);
  const adherenceLabel = weekStats?.adherence != null ? `${weekStats.adherence}% week adherence` : null;

  function persist(next: MealItem[]) {
    setMeals(next);
    save.mutate({
      date: today, meals: next,
      total_calories: next.reduce((a, m) => a + (m.calories || 0), 0),
      total_protein: next.reduce((a, m) => a + (m.protein || 0), 0),
    });
  }
  function add() {
    if (!name || !calories) return;
    persist([...meals, { id: crypto.randomUUID(), slot, name, calories: Number(calories), protein: Number(protein) || 0 }]);
    setName(""); setCalories(""); setProtein("");
  }
  const remove = (id: string) => persist(meals.filter((m) => m.id !== id));

  const [analyzing, setAnalyzing] = useState(false);
  async function analyzePhoto(dataUrl: string) {
    setAnalyzing(true);
    try {
      const { analysis } = await apiPost<{ analysis: any }>("/api/ai/meal-vision", { image: dataUrl, mimeType: "image/jpeg" });
      persist([...meals, {
        id: crypto.randomUUID(), slot, name: analysis.name || "Meal from photo",
        calories: Math.round(analysis.calories) || 0, protein: Math.round(analysis.protein) || 0,
      }]);
      toast.success(`Added ${analysis.name} (~${Math.round(analysis.calories)} kcal, ${analysis.confidence} confidence)`);
    } catch (e: any) {
      toast.error(e.message || "Couldn't analyze photo");
    } finally {
      setAnalyzing(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-accent/10 text-accent"><Apple className="h-5 w-5" /></span>
        {adherenceLabel && <p className="text-xs text-muted-foreground mb-1">{adherenceLabel} · {weekStats?.daysLogged ?? 0}/7 days logged</p>}
      <h1 className="text-3xl font-bold tracking-tight">Nutrition</h1>
      </div>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Panel className="flex items-center gap-4 sm:col-span-1">
          <Ring value={totals.cal / target} tone="chart-2" center={totals.cal} sub="kcal" />
          <div>
            <div className="text-sm text-muted-foreground">of {target} target</div>
            <div className="text-lg font-semibold">{remaining} left</div>
          </div>
        </Panel>
        <Panel className="sm:col-span-2">
          <div className="space-y-4">
            <MacroBar label="Protein" value={totals.pro} target={macroGoal.protein} tone="var(--color-primary)" />
            <MacroBar label="Carbs" value={0} target={macroGoal.carbs} tone="var(--color-accent)" />
            <MacroBar label="Fat" value={0} target={macroGoal.fat} tone="var(--color-chart-2)" />
          </div>
        </Panel>
      </div>

      {/* Snap a meal → AI */}
      <Panel title="Snap a meal">
        <div className="flex flex-wrap items-center gap-4">
          <PhotoCapture onCapture={analyzePhoto} busy={analyzing} label={analyzing ? "Analyzing…" : "Take / upload a photo"} preview={false} />
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4 text-primary" /> AI estimates calories &amp; protein and adds it to <span className="font-medium text-foreground">{slot}</span>.
          </div>
        </div>
      </Panel>

      {/* Add food */}
      <Panel title="Add food manually">
        <div className="grid gap-2 sm:grid-cols-[130px_1fr_90px_90px_auto]">
          <select value={slot} onChange={(e) => setSlot(e.target.value)} className="rounded-xl border border-input bg-background px-3 py-2.5 text-sm">
            {SLOTS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Food name" className="rounded-xl border border-input bg-background px-3 py-2.5 text-sm" />
          <input value={calories} onChange={(e) => setCalories(e.target.value)} type="number" placeholder="kcal" className="rounded-xl border border-input bg-background px-3 py-2.5 text-sm" />
          <input value={protein} onChange={(e) => setProtein(e.target.value)} type="number" placeholder="protein" className="rounded-xl border border-input bg-background px-3 py-2.5 text-sm" />
          <button onClick={add} disabled={!name || !calories} className="inline-flex items-center justify-center rounded-xl bg-[image:var(--gradient-primary)] px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50">
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </Panel>

      {/* Meals by slot */}
      <div className="space-y-4">
        {SLOTS.map((s) => {
          const items = meals.filter((m) => m.slot === s);
          if (!items.length) return null;
          return (
            <Panel key={s}>
              <div className="mb-2 text-sm font-semibold text-muted-foreground">{s}</div>
              <ul className="divide-y divide-border">
                {items.map((m) => (
                  <li key={m.id} className="flex items-center justify-between py-2.5">
                    <div>
                      <div className="text-sm font-medium">{m.name}</div>
                      <div className="text-xs text-muted-foreground">{m.calories} kcal · {m.protein}g protein</div>
                    </div>
                    <button onClick={() => remove(m.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                  </li>
                ))}
              </ul>
            </Panel>
          );
        })}
        {meals.length === 0 && (
          <div className="rounded-3xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
            No meals logged today. Add your first above.
          </div>
        )}
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
      <div className="h-2.5 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: tone }} />
      </div>
    </div>
  );
}
