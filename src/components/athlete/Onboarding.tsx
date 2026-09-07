"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { apiPatch } from "@/lib/fetcher";
import { Activity, ArrowRight, ArrowLeft, Loader2, Check } from "lucide-react";

const TRACKS = [
  { key: "football", label: "Football / sports athlete", emoji: "⚽" },
  { key: "hypertrophy", label: "Build muscle", emoji: "💪" },
  { key: "fat_loss", label: "Lose fat / get lean", emoji: "🔥" },
  { key: "endurance", label: "Endurance / running", emoji: "🏃" },
  { key: "general", label: "General fitness", emoji: "🌱" },
  { key: "return_to_train", label: "Returning after break/injury", emoji: "🩹" },
];

const LEVELS = [
  { key: "beginner", label: "Beginner" },
  { key: "intermediate", label: "Intermediate" },
  { key: "advanced", label: "Advanced" },
];

const EQUIPMENT = ["body weight", "dumbbell", "barbell", "kettlebell", "cable", "resistance band", "machine", "bench"];

const inputCls =
  "w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30";

function H({ children }: { children: React.ReactNode }) {
  return <h2 className="text-lg font-semibold mb-3">{children}</h2>;
}

export function Onboarding({ name }: { name: string }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const [track, setTrack] = useState("general");
  const [level, setLevel] = useState("beginner");
  const [gender, setGender] = useState("");
  const [age, setAge] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [target, setTarget] = useState("");
  const [days, setDays] = useState("3");
  const [duration, setDuration] = useState("45");
  const [equipment, setEquipment] = useState<string[]>(["body weight"]);
  const [location, setLocation] = useState("home");
  const [momoNumber, setMomoNumber] = useState("");
  const [momoName, setMomoName] = useState("");
  const [aspiration, setAspiration] = useState("");

  const toggleEquip = (e: string) =>
    setEquipment((p) => (p.includes(e) ? p.filter((x) => x !== e) : [...p, e]));

  function ageBandFromAge(n: number) {
    if (n < 12) return "youth_u12";
    if (n < 14) return "youth_u14";
    if (n < 18) return "youth_u17";
    if (n >= 40) return "masters";
    return "adult";
  }

  async function finish() {
    if (!age || Number(age) < 5) {
      toast.error("Enter a valid age — plans are age-safe");
      setStep(1);
      return;
    }
    if (!momoNumber.trim() || !momoName.trim()) {
      toast.error("MoMo number and name are required");
      setStep(steps.length - 1);
      return;
    }
    setLoading(true);
    try {
      const ageN = Number(age);
      const goalLabel = TRACKS.find((t) => t.key === track)?.label || track;
      await apiPatch("/api/profile", {
        primary_goal: goalLabel,
        goal_description: aspiration || goalLabel,
        track,
        age_band: ageBandFromAge(ageN),
        level,
        gender: gender || null,
        age: ageN,
        height: height ? Number(height) : undefined,
        weight: weight ? Number(weight) : undefined,
        target_weight: target ? Number(target) : undefined,
        training_days_per_week: Number(days),
        session_duration_min: Number(duration),
        equipment,
        training_location: location,
        momo_number: momoNumber,
        momo_name: momoName,
        onboarding_completed: true,
      });
      toast.success("You're set — building age- and goal-safe plans");
      router.refresh();
    } catch (e: any) {
      toast.error(e.message || "Failed");
      setLoading(false);
    }
  }

  const steps = [
    <div key="track">
      <H>What are you training for?</H>
      <p className="text-xs text-muted-foreground mb-3">This drives your daily workout cards (football, muscle, etc.).</p>
      <div className="grid grid-cols-2 gap-2">
        {TRACKS.map((g) => (
          <button
            key={g.key}
            type="button"
            onClick={() => setTrack(g.key)}
            className={`rounded-2xl border px-3 py-3 text-left text-sm ${
              track === g.key ? "border-primary bg-primary/10" : "border-border"
            }`}
          >
            <span className="text-lg">{g.emoji}</span>
            <div className="font-medium mt-1">{g.label}</div>
          </button>
        ))}
      </div>
      <textarea
        className={`${inputCls} mt-3`}
        rows={2}
        placeholder="Optional: e.g. I want to be a football player"
        value={aspiration}
        onChange={(e) => setAspiration(e.target.value)}
      />
    </div>,
    <div key="age">
      <H>Age, level & body</H>
      <p className="text-xs text-muted-foreground mb-3">Youth plans avoid heavy lifts; adults get full progressions.</p>
      <div className="grid gap-2 sm:grid-cols-2">
        <input className={inputCls} type="number" placeholder="Age *" value={age} onChange={(e) => setAge(e.target.value)} />
        <select className={inputCls} value={gender} onChange={(e) => setGender(e.target.value)}>
          <option value="">Gender (optional)</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </select>
        <input className={inputCls} type="number" placeholder="Height cm" value={height} onChange={(e) => setHeight(e.target.value)} />
        <input className={inputCls} type="number" placeholder="Weight kg" value={weight} onChange={(e) => setWeight(e.target.value)} />
        <input className={inputCls} type="number" placeholder="Target weight kg" value={target} onChange={(e) => setTarget(e.target.value)} />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {LEVELS.map((l) => (
          <button
            key={l.key}
            type="button"
            onClick={() => setLevel(l.key)}
            className={`rounded-full px-3 py-1.5 text-xs border ${
              level === l.key ? "border-primary bg-primary/10 text-primary" : "border-border"
            }`}
          >
            {l.label}
          </button>
        ))}
      </div>
    </div>,
    <div key="train">
      <H>Schedule & equipment</H>
      <div className="grid gap-2 sm:grid-cols-2">
        <input className={inputCls} type="number" value={days} onChange={(e) => setDays(e.target.value)} placeholder="Days / week" />
        <input className={inputCls} type="number" value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="Minutes / session" />
        <select className={inputCls} value={location} onChange={(e) => setLocation(e.target.value)}>
          <option value="home">Home</option>
          <option value="gym">Gym</option>
          <option value="outdoor">Outdoor</option>
        </select>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {EQUIPMENT.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => toggleEquip(item)}
            className={`rounded-full px-3 py-1.5 text-xs border ${
              equipment.includes(item) ? "border-primary bg-primary/10 text-primary" : "border-border"
            }`}
          >
            {item}
          </button>
        ))}
      </div>
    </div>,
    <div key="momo">
      <H>MoMo details</H>
      <p className="text-xs text-muted-foreground mb-2">Required so payments to 8787 can be matched to you.</p>
      <input className={inputCls} value={momoNumber} onChange={(e) => setMomoNumber(e.target.value)} placeholder="e.g. 07xxxxxxxx" />
      <input className={`${inputCls} mt-2`} value={momoName} onChange={(e) => setMomoName(e.target.value)} placeholder="Full name as on MoMo" />
    </div>,
  ];

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col justify-center px-4 py-10">
      <div className="mb-6 flex items-center gap-2">
        <Activity className="h-6 w-6 text-primary" />
        <div>
          <div className="font-semibold">Welcome{name ? `, ${name}` : ""}</div>
          <div className="text-xs text-muted-foreground">Plans adapt to your age, sport goal, and equipment</div>
        </div>
      </div>
      <div className="flex gap-1">
        {steps.map((_, i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-primary" : "bg-muted"}`} />
        ))}
      </div>
      <div className="mt-6">{steps[step]}</div>
      <div className="mt-8 flex gap-2">
        {step > 0 && (
          <button
            type="button"
            onClick={() => setStep(step - 1)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border px-4 py-2.5 text-sm hover:bg-accent/10"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
        )}
        {step < steps.length - 1 ? (
          <button
            type="button"
            onClick={() => setStep(step + 1)}
            className="ml-auto inline-flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
          >
            Next <ArrowRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={finish}
            disabled={loading}
            className="ml-auto inline-flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Finish
          </button>
        )}
      </div>
    </div>
  );
}
