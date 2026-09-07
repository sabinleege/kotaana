"use client";

/**
 * Unified Settings — Profile, Subscription, Equipment, Coach, Privacy, Permissions, Notifications, Health, AI.
 */
import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { useProfile, useUpdateProfile } from "@/hooks/use-athlete-data";
import { ConnectPanel } from "@/components/ConnectPanel";
import { MomoPayPanel } from "@/components/payments/MomoPayPanel";
import {
  LogOut, User, CreditCard, Dumbbell, Users, Shield, Bell, HeartPulse, Sparkles, Search,
} from "lucide-react";

const EQUIPMENT = [
  "Dumbbells", "Barbell", "Resistance bands", "Bench", "Pull-up bar", "Treadmill",
  "Exercise bike", "Kettlebells", "Medicine balls", "Skipping rope", "Gym membership",
  "Swimming pool", "None",
];

const SECTIONS = [
  { id: "profile", label: "Profile", icon: User },
  { id: "subscription", label: "Subscription", icon: CreditCard },
  { id: "equipment", label: "Equipment", icon: Dumbbell },
  { id: "coach", label: "Coach", icon: Users },
  { id: "privacy", label: "Privacy & permissions", icon: Shield },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "health", label: "Health preferences", icon: HeartPulse },
  { id: "ai", label: "AI preferences", icon: Sparkles },
] as const;

const COACH_PERMS = [
  "weight", "body_measurements", "workout_history", "nutrition", "water", "health",
  "injuries", "sleep", "progress_photos", "menstrual_cycle", "diseases", "medication",
  "subscription", "location", "online_status",
] as const;

export default function AthleteSettingsPage() {
  const { data: profile } = useProfile();
  const update = useUpdateProfile();
  const p: any = profile ?? {};
  const [section, setSection] = useState<string>("profile");
  const [equipment, setEquipment] = useState<string[]>([]);
  const [perms, setPerms] = useState<Record<string, boolean>>({});
  const [coachQuery, setCoachQuery] = useState("");
  const [coachResults, setCoachResults] = useState<any[]>([]);
  const [myCode, setMyCode] = useState("");

  useEffect(() => {
    if (!profile) return;
    setEquipment(Array.isArray(p.equipment) ? p.equipment : []);
    setMyCode(p.connect_code || "");
    const stored = p.coach_permissions || {};
    const next: Record<string, boolean> = {};
    COACH_PERMS.forEach((k) => {
      next[k] = stored[k] !== false; // default allow unless explicitly false
    });
    setPerms(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  function toggleEquip(item: string) {
    const next = equipment.includes(item)
      ? equipment.filter((e) => e !== item)
      : [...equipment.filter((e) => e !== "None"), item];
    if (item === "None") {
      setEquipment(["None"]);
      update.mutate({ equipment: ["None"] });
      return;
    }
    setEquipment(next.filter((e) => e !== "None"));
    update.mutate({ equipment: next.filter((e) => e !== "None") });
  }

  function savePerms() {
    update.mutate({ coach_permissions: perms } as any);
  }

  async function searchCoaches() {
    if (!coachQuery.trim()) return;
    const res = await fetch(`/api/connections/search?q=${encodeURIComponent(coachQuery)}`).catch(() => null);
    if (!res || !res.ok) {
      // fallback demo empty
      setCoachResults([]);
      return;
    }
    const data = await res.json();
    setCoachResults(data.coaches || data.results || []);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">Profile, equipment, coach, privacy, AI — one place.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            onClick={() => setSection(s.id)}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${
              section === s.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}
          >
            <s.icon className="h-3.5 w-3.5" />
            {s.label}
          </button>
        ))}
      </div>

      {section === "profile" && (
        <div className="rounded-2xl border border-border bg-card p-6 space-y-2">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Account</div>
          <div className="font-medium">{p.full_name || "—"}</div>
          <div className="text-sm text-muted-foreground">{p.email}</div>
          <div className="text-sm text-muted-foreground">
            Your athlete code: <code className="rounded bg-muted px-1.5 py-0.5">{myCode || "generating…"}</code>
          </div>
          <Link href="/app/profile" className="inline-block text-sm text-primary hover:underline">
            Edit full profile →
          </Link>
        </div>
      )}

      {section === "subscription" && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            MoMo only (code 8787). Buy creates a pending order for owner/coach approval. Receipt appears in Notifications when approved.
          </p>
          <MomoPayPanel role="athlete" />
        </div>
      )}

      {section === "equipment" && (
        <div className="rounded-2xl border border-border bg-card p-6">
          <p className="text-sm text-muted-foreground mb-4">
            AI workouts use only the equipment you select.
          </p>
          <div className="flex flex-wrap gap-2">
            {EQUIPMENT.map((item) => (
              <button
                key={item}
                onClick={() => toggleEquip(item)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium border ${
                  equipment.includes(item)
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      )}

      {section === "coach" && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="font-semibold flex items-center gap-2">
              <Search className="h-4 w-4" /> Search coach
            </h2>
            <div className="mt-2 flex gap-2">
              <input
                value={coachQuery}
                onChange={(e) => setCoachQuery(e.target.value)}
                placeholder="Name, email, or coach ID"
                className="flex-1 rounded-xl border border-input bg-background px-3 py-2 text-sm"
              />
              <button onClick={searchCoaches} className="rounded-xl bg-primary px-3 py-2 text-sm text-primary-foreground">
                Search
              </button>
            </div>
            <ul className="mt-3 space-y-2">
              {coachResults.map((c: any) => (
                <li key={c.id} className="rounded-xl border border-border px-3 py-2 text-sm space-y-1">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <div className="font-medium">{c.name || c.email}</div>
                      <div className="text-xs text-muted-foreground">{c.email}</div>
                      {c.connect_code && (
                        <div className="text-[11px] text-muted-foreground">Code: {c.connect_code}</div>
                      )}
                      {c.has_momo ? (
                        <div className="text-[11px] mt-0.5 text-emerald-700 dark:text-emerald-400">
                          MoMo: {c.momo_name} · {c.momo_number}
                        </div>
                      ) : (
                        <div className="text-[11px] text-muted-foreground">MoMo not set yet</div>
                      )}
                    </div>
                    <button
                      type="button"
                      className="text-primary text-xs shrink-0 font-medium"
                      onClick={async () => {
                        try {
                          const r = await fetch("/api/connections/request", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ email: c.email }),
                          });
                          if (!r.ok) {
                            const j = await r.json().catch(() => ({}));
                            alert(j.error || "Request failed");
                            return;
                          }
                          alert("Request sent — coach must approve");
                        } catch {
                          alert("Request failed");
                        }
                      }}
                    >
                      Request
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <ConnectPanel variant="athlete" />
        </div>
      )}

      {section === "privacy" && (
        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="font-semibold">What your coach can view</h2>
          <p className="text-xs text-muted-foreground mt-1 mb-4">Each permission is independent.</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {COACH_PERMS.map((k) => (
              <label key={k} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={!!perms[k]}
                  onChange={(e) => setPerms({ ...perms, [k]: e.target.checked })}
                />
                {k.replace(/_/g, " ")}
              </label>
            ))}
          </div>
          <button onClick={savePerms} className="mt-4 rounded-xl bg-primary px-4 py-2 text-sm text-primary-foreground">
            Save permissions
          </button>
        </div>
      )}

      {section === "notifications" && (
        <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
          Open the <Link href="/app/notifications" className="text-primary">Notifications</Link> page for coach
          requests, AI advice, reminders, injury and recovery alerts.
        </div>
      )}

      {section === "health" && (
        <div className="rounded-2xl border border-border bg-card p-6 text-sm">
          Manage injuries, diseases, medication, cycle and illness in{" "}
          <Link href="/app/health" className="text-primary">
            Health
          </Link>
          .
        </div>
      )}

      {section === "ai" && (
        <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
          AI uses your equipment list, health flags, and weekly summary. Chat is available from the floating coach
          button. Scope guard refuses non-fitness topics.
        </div>
      )}

      <button
        onClick={() => signOut({ callbackUrl: "/" })}
        className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm hover:bg-accent/10"
      >
        <LogOut className="h-4 w-4" /> Sign out
      </button>
    </div>
  );
}
