"use client";

import { useEffect, useState } from "react";
import { useProfile, useUpdateProfile } from "@/hooks/use-athlete-data";
import { User } from "lucide-react";

const FIELDS: { key: string; label: string; type?: string }[] = [
  { key: "full_name", label: "Full name" },
  { key: "age", label: "Age", type: "number" },
  { key: "height", label: "Height (cm)", type: "number" },
  { key: "weight", label: "Weight (kg)", type: "number" },
  { key: "target_weight", label: "Target weight (kg)", type: "number" },
  { key: "body_fat", label: "Body fat % (if measured)", type: "number" },
  { key: "gender", label: "Gender (male/female)" },
  { key: "activity_level", label: "Activity level" },
  { key: "primary_goal", label: "Primary goal" },
  { key: "goal_description", label: "Goal description" },
  { key: "daily_calories_target", label: "Daily calorie target", type: "number" },
];

export default function ProfilePage() {
  const { data: profile } = useProfile();
  const update = useUpdateProfile();
  const [form, setForm] = useState<Record<string, any>>({});

  useEffect(() => {
    if (profile) setForm(profile);
  }, [profile]);

  function save() {
    const patch: Record<string, any> = {};
    for (const f of FIELDS) {
      let v = form[f.key];
      if (v === undefined || v === null || v === "") continue;
      if (f.type === "number") v = Number(v);
      patch[f.key] = v;
    }
    update.mutate(patch);
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
          <User className="h-5 w-5" />
        </span>
        <h1 className="text-3xl font-semibold">Profile</h1>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          {FIELDS.map((f) => (
            <div key={f.key} className="grid gap-1.5">
              <label className="text-sm text-muted-foreground">{f.label}</label>
              <input
                type={f.type ?? "text"}
                value={form[f.key] ?? ""}
                onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          ))}
        </div>
        <button
          onClick={save} disabled={update.isPending}
          className="mt-6 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          Save changes
        </button>
      </div>
    </div>
  );
}
