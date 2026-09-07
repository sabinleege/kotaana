"use client";

/**
 * Health hub — Injuries, diseases, medication, allergies, pain, recovery, sleep, water, illness, cycle.
 */
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useProfile, useUpdateProfile, useMyInjuries } from "@/hooks/use-athlete-data";
import { Panel } from "@/components/athlete/ui";
import { HeartPulse, Plus, Trash2, Baby, Pill, ShieldAlert, Moon, Droplets, Thermometer } from "lucide-react";
import { InjuryTimelineCard } from "@/components/athlete/InjuryTimelineCard";

type Condition = { type: string; notes?: string; since?: string; medications?: string };

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "injuries", label: "Injuries" },
  { id: "conditions", label: "Diseases & chronic" },
  { id: "meds", label: "Medication & allergies" },
  { id: "illness", label: "Illness / sick today" },
  { id: "recovery", label: "Recovery & sleep" },
  { id: "cycle", label: "Cycle (private)" },
] as const;

function HealthInner() {
  const params = useSearchParams();
  const initial = params.get("tab") || "overview";
  const [tab, setTab] = useState<string>(initial);
  const { data: profile } = useProfile();
  const update = useUpdateProfile();
  const { data: injuries = [] } = useMyInjuries();
  const p: any = profile ?? {};

  const [conditions, setConditions] = useState<Condition[]>([]);
  const [newC, setNewC] = useState<Condition>({ type: "" });
  const [pregnant, setPregnant] = useState(false);
  const [dueDate, setDueDate] = useState("");
  const [cycleOn, setCycleOn] = useState(false);
  const [lastPeriod, setLastPeriod] = useState("");
  const [cycleLen, setCycleLen] = useState("28");
  const [allergies, setAllergies] = useState("");
  const [sickNotes, setSickNotes] = useState("");
  const [painNotes, setPainNotes] = useState("");

  useEffect(() => {
    const t = params.get("tab");
    if (t) setTab(t);
  }, [params]);

  useEffect(() => {
    if (!profile) return;
    setConditions(Array.isArray(p.health_conditions) ? p.health_conditions : []);
    setPregnant(!!p.is_pregnant);
    setDueDate(p.pregnancy_due_date ? String(p.pregnancy_due_date).slice(0, 10) : "");
    setCycleOn(!!p.cycle_tracking);
    setLastPeriod(p.cycle_last_period ? String(p.cycle_last_period).slice(0, 10) : "");
    setCycleLen(String(p.cycle_length_days ?? 28));
    setAllergies(Array.isArray(p.allergies) ? p.allergies.join(", ") : p.allergies || "");
    setPainNotes(p.pain_areas || "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  function saveConditions(next: Condition[]) {
    setConditions(next);
    update.mutate({ health_conditions: next });
  }

  const activeInjuries = injuries.filter((i: any) => i.status !== "resolved");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary">
          <HeartPulse className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Health</h1>
          <p className="text-sm text-muted-foreground">
            Injuries, conditions, medication, recovery — your AI plan adapts to these.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium ${
              tab === t.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <>
        <div className="mb-3">
          <a href="/app/medical" className="text-sm text-primary hover:underline">Medical documents →</a>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Link href="/app/health?tab=injuries" className="rounded-2xl border border-border bg-card p-4 hover:bg-accent/5">
            <ShieldAlert className="h-5 w-5 text-destructive" />
            <div className="mt-2 font-semibold">Injuries</div>
            <div className="text-sm text-muted-foreground">{activeInjuries.length} active</div>
          </Link>
          <button onClick={() => setTab("conditions")} className="rounded-2xl border border-border bg-card p-4 text-left hover:bg-accent/5">
            <HeartPulse className="h-5 w-5 text-primary" />
            <div className="mt-2 font-semibold">Diseases & chronic</div>
            <div className="text-sm text-muted-foreground">{conditions.length} logged</div>
          </button>
          <button onClick={() => setTab("illness")} className="rounded-2xl border border-border bg-card p-4 text-left hover:bg-accent/5">
            <Thermometer className="h-5 w-5 text-amber-600" />
            <div className="mt-2 font-semibold">Feeling sick?</div>
            <div className="text-sm text-muted-foreground">Report illness today</div>
          </button>
          <button onClick={() => setTab("recovery")} className="rounded-2xl border border-border bg-card p-4 text-left hover:bg-accent/5">
            <Moon className="h-5 w-5 text-primary" />
            <div className="mt-2 font-semibold">Recovery & sleep</div>
            <div className="text-sm text-muted-foreground">Rest and readiness</div>
          </button>
        </div>
      )}

      {tab === "injuries" && (
        <Panel title="Injuries">
          <p className="mb-3 text-sm text-muted-foreground">
            Track body-part injuries. Active ones feed AI safety rules and coach alerts.
          </p>
          {activeInjuries.length === 0 ? (
            <p className="text-sm text-muted-foreground">No active injuries.</p>
          ) : (
            <div className="space-y-3">
              {activeInjuries.map((i: any) => (
                <InjuryTimelineCard
                  key={i.id}
                  injury={{
                    id: i.id,
                    bodyPart: i.body_part || i.bodyPart,
                    injuryType: i.injury_type || i.injuryType,
                    severity: i.severity,
                    status: i.status,
                    dateReported: i.date_reported || i.dateReported,
                    expectedReturn: i.expected_return || i.expectedReturn,
                    restrictions: i.restrictions,
                    healingPercent: i.healing_percent || i.healingPercent,
                  }}
                />
              ))}
            </div>
          )}
          <p className="mt-3 text-xs text-muted-foreground">
            Build a recovery timeline per injury. Active restrictions feed the AI profile report.
          </p>
        </Panel>
      )}

      {tab === "conditions" && (
        <Panel title="Diseases & chronic conditions">
          <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
            <input
              value={newC.type}
              onChange={(e) => setNewC({ ...newC, type: e.target.value })}
              placeholder="e.g. asthma, diabetes, hypertension"
              className="rounded-xl border border-input bg-background px-3 py-2.5 text-sm"
            />
            <input
              value={newC.medications ?? ""}
              onChange={(e) => setNewC({ ...newC, medications: e.target.value })}
              placeholder="Medications"
              className="rounded-xl border border-input bg-background px-3 py-2.5 text-sm"
            />
            <button
              onClick={() => {
                if (!newC.type.trim()) return;
                saveConditions([
                  ...conditions,
                  { ...newC, since: newC.since || new Date().toISOString().slice(0, 10) },
                ]);
                setNewC({ type: "" });
              }}
              className="rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-4 space-y-2">
            {conditions.map((c, i) => (
              <div key={i} className="flex items-center justify-between rounded-xl border border-border px-3 py-2 text-sm">
                <div>
                  <div className="font-medium">{c.type}</div>
                  {c.medications && <div className="text-xs text-muted-foreground">{c.medications}</div>}
                </div>
                <button
                  onClick={() => saveConditions(conditions.filter((_, j) => j !== i))}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {tab === "meds" && (
        <Panel title="Medication & allergies">
          <label className="text-xs text-muted-foreground">Allergies (comma-separated)</label>
          <input
            value={allergies}
            onChange={(e) => setAllergies(e.target.value)}
            className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm"
          />
          <label className="mt-4 block text-xs text-muted-foreground">Pain areas / notes</label>
          <textarea
            value={painNotes}
            onChange={(e) => setPainNotes(e.target.value)}
            rows={3}
            className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm"
          />
          <button
            onClick={() =>
              update.mutate({
                allergies: allergies.split(",").map((s) => s.trim()).filter(Boolean),
                pain_areas: painNotes,
              })
            }
            className="mt-3 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Save
          </button>
        </Panel>
      )}

      {tab === "illness" && (
        <Panel title="Illness reporting">
          <p className="text-sm text-muted-foreground mb-3">
            If you feel sick today, log it here. This can pause hard training recommendations.
          </p>
          <textarea
            value={sickNotes}
            onChange={(e) => setSickNotes(e.target.value)}
            placeholder="Symptoms, fever, etc."
            rows={4}
            className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm"
          />
          <button
            onClick={async () => {
              await fetch("/api/checkins", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  feeling: "sick",
                  symptoms: sickNotes,
                  date: new Date().toISOString().slice(0, 10),
                }),
              }).catch(() => {});
              alert("Illness reported for today. Your coach and AI will see this signal.");
            }}
            className="mt-3 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Report sick today
          </button>
        </Panel>
      )}

      {tab === "recovery" && (
        <Panel title="Recovery, sleep & water">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-border p-4">
              <Moon className="h-5 w-5 text-primary" />
              <div className="mt-2 text-sm text-muted-foreground">Log sleep quality in Daily Check-in on Home.</div>
            </div>
            <div className="rounded-xl border border-border p-4">
              <Droplets className="h-5 w-5 text-primary" />
              <div className="mt-2 text-sm text-muted-foreground">
                Water: {p.water_glasses ?? 0} / {p.water_target ?? 8} glasses — track on Nutrition & Home.
              </div>
            </div>
          </div>
        </Panel>
      )}

      {tab === "cycle" && (
        <Panel title="Menstrual cycle (private)">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={cycleOn} onChange={(e) => setCycleOn(e.target.checked)} />
            Enable cycle tracking
          </label>
          {cycleOn && (
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <div>
                <label className="text-xs text-muted-foreground">Last period start</label>
                <input
                  type="date"
                  value={lastPeriod}
                  onChange={(e) => setLastPeriod(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Cycle length (days)</label>
                <input
                  value={cycleLen}
                  onChange={(e) => setCycleLen(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
            </div>
          )}
          <div className="mt-4 flex items-center gap-2">
            <Baby className="h-4 w-4" />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={pregnant} onChange={(e) => setPregnant(e.target.checked)} />
              Currently pregnant
            </label>
          </div>
          {pregnant && (
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="mt-2 rounded-xl border border-input bg-background px-3 py-2 text-sm"
            />
          )}
          <button
            onClick={() =>
              update.mutate({
                cycle_tracking: cycleOn,
                cycle_last_period: cycleOn ? lastPeriod || null : null,
                cycle_length_days: Number(cycleLen) || 28,
                is_pregnant: pregnant,
                pregnancy_due_date: pregnant ? dueDate || null : null,
              })
            }
            className="mt-3 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Save privacy-sensitive health
          </button>
        </Panel>
      )}
    </div>
  );
}

export default function HealthPage() {
  return (
    <Suspense fallback={<div className="h-40 animate-pulse rounded-2xl bg-muted/40" />}>
      <HealthInner />
    </Suspense>
  );
}
