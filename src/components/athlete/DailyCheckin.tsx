"use client";

import { useEffect, useState } from "react";
import { useTodayCheckin, useSaveCheckin } from "@/hooks/use-athlete-data";
import { HeartPulse, X, Loader2 } from "lucide-react";

const FEELINGS = [
  { key: "great", emoji: "💪", label: "Great" },
  { key: "ok", emoji: "🙂", label: "Okay" },
  { key: "off", emoji: "😕", label: "A bit off" },
  { key: "sick", emoji: "🤒", label: "Unwell" },
] as const;

export function DailyCheckin() {
  const { data: existing, isLoading } = useTodayCheckin();
  const save = useSaveCheckin();
  const [open, setOpen] = useState(false);
  const [feeling, setFeeling] = useState<(typeof FEELINGS)[number]["key"]>("ok");
  const [energy, setEnergy] = useState(3);
  const [soreness, setSoreness] = useState(2);
  const [mood, setMood] = useState(3);
  const [sleep, setSleep] = useState("7");
  const [symptoms, setSymptoms] = useState("");

  // Auto-open once per day when no check-in exists yet.
  useEffect(() => {
    if (!isLoading && !existing) {
      const dismissed = sessionStorage.getItem("checkin-dismissed");
      if (!dismissed) setOpen(true);
    }
  }, [isLoading, existing]);

  function dismiss() {
    sessionStorage.setItem("checkin-dismissed", "1");
    setOpen(false);
  }

  function submit() {
    save.mutate(
      { feeling, energy, soreness, mood, sleep_hours: Number(sleep) || null, symptoms: symptoms || null },
      { onSuccess: () => setOpen(false) },
    );
  }

  // A small always-present trigger so they can re-check-in / edit.
  const trigger = (
    <button
      onClick={() => setOpen(true)}
      className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm hover:border-primary/40"
    >
      <HeartPulse className="h-4 w-4 text-primary" />
      {existing ? `Readiness ${existing.readiness}%` : "Daily check-in"}
    </button>
  );

  return (
    <>
      {trigger}
      {open && (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-black/60 p-4 backdrop-blur-sm" onClick={dismiss}>
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold">How are you today?</h2>
                <p className="mt-1 text-sm text-muted-foreground">Your answers tune today's plan to your body.</p>
              </div>
              <button onClick={dismiss} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>

            <div className="mt-5 grid grid-cols-4 gap-2">
              {FEELINGS.map((f) => (
                <button key={f.key} onClick={() => setFeeling(f.key)}
                  className={`rounded-2xl border p-3 text-center transition ${feeling === f.key ? "border-primary bg-primary/10" : "border-border hover:bg-accent/10"}`}>
                  <div className="text-2xl">{f.emoji}</div>
                  <div className="mt-1 text-[11px] text-muted-foreground">{f.label}</div>
                </button>
              ))}
            </div>

            <div className="mt-5 space-y-4">
              <Slider label="Energy" value={energy} onChange={setEnergy} />
              <Slider label="Soreness" value={soreness} onChange={setSoreness} />
              <Slider label="Mood" value={mood} onChange={setMood} />
              <div className="flex items-center justify-between gap-3">
                <label className="text-sm text-muted-foreground">Sleep (hours)</label>
                <input type="number" step="0.5" value={sleep} onChange={(e) => setSleep(e.target.value)}
                  className="w-24 rounded-lg border border-input bg-background px-3 py-1.5 text-sm" />
              </div>
              {(feeling === "off" || feeling === "sick") && (
                <textarea value={symptoms} onChange={(e) => setSymptoms(e.target.value)} rows={2}
                  placeholder="What's going on? (symptoms, pain, illness…)"
                  className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm" />
              )}
            </div>

            <div className="mt-6 flex gap-2">
              <button onClick={dismiss} className="flex-1 rounded-xl border border-border py-2.5 text-sm hover:bg-accent/10">Later</button>
              <button onClick={submit} disabled={save.isPending}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-[image:var(--gradient-primary)] py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50">
                {save.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Slider({ label, value, onChange }: { label: string; value: number; onChange: (n: number) => void }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{value}/5</span>
      </div>
      <input type="range" min={1} max={5} value={value} onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[color:var(--color-primary)]" />
    </div>
  );
}
