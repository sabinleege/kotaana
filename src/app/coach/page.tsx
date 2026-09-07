"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useMyAthletes, useCoachProfile } from "@/hooks/use-coach-data";
import { useInjuries } from "@/hooks/use-injuries";
import { useFollowUps } from "@/hooks/use-follow-ups";
import { TeamStatGrid, type TeamStat } from "@/components/coach/TeamStatGrid";
import { TeamTrendChart } from "@/components/coach/TeamTrendChart";
import { AthleteCard } from "@/components/coach/AthleteCard";
import {
  Users, Activity, Flame, TrendingUp, ArrowRight, Plus, ShieldAlert, AlertTriangle, Dumbbell,
} from "lucide-react";

export default function CoachOverview() {
  const { data: me } = useCoachProfile();
  const { data: athletes = [], isLoading } = useMyAthletes();
  const { data: injuries = [] } = useInjuries({ activeOnly: true });
  const { data: followUps = [] } = useFollowUps({ status: "pending" });

  const active = athletes.filter((a) => a.relation_status === "active");
  const avg = (k: "fitness_score" | "recovery_score" | "consistency_score") =>
    active.length ? Math.round(active.reduce((s, a) => s + (a[k] ?? 0), 0) / active.length) : 0;
  const atRisk = active.filter((a) => (a.consistency_score ?? 0) < 50).length;

  const stats: TeamStat[] = [
    { icon: Users, label: "Active athletes", value: active.length, hint: `${athletes.length} total`, trend: 12 },
    { icon: Flame, label: "Avg fitness", value: avg("fitness_score"), accent: "accent", trend: 4 },
    { icon: Activity, label: "Avg recovery", value: avg("recovery_score"), trend: -2 },
    { icon: TrendingUp, label: "Avg adherence", value: avg("consistency_score") + "%", accent: "accent", trend: 6 },
    { icon: ShieldAlert, label: "Active injuries", value: injuries.length, accent: "destructive", hint: `${followUps.length} follow-ups` },
    { icon: AlertTriangle, label: "At-risk", value: atRisk, accent: "destructive", hint: "Adherence <50%" },
  ];

  const trend = useMemo(() => {
    const base = avg("consistency_score");
    const baseFit = avg("fitness_score");
    return Array.from({ length: 8 }, (_, i) => ({
      label: `W${i + 1}`,
      adherence: Math.max(20, Math.min(100, base + Math.round(Math.sin(i) * 8 + (i - 4)))),
      fitness: Math.max(20, Math.min(100, baseFit + Math.round(Math.cos(i) * 6 + i))),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [athletes]);

  return (
    <div className="mx-auto max-w-7xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-sm text-muted-foreground">Welcome back</div>
          <h1 className="text-3xl font-semibold">Coach {me?.full_name?.split(" ")[0] || "—"}</h1>
        </div>
        <div className="flex gap-2">
          <Link href="/coach/follow-ups" className="inline-flex items-center rounded-lg border border-border px-4 py-2 text-sm hover:bg-accent/10">
            <Plus className="mr-2 h-4 w-4" /> Follow-up
          </Link>
          <Link href="/coach/athletes" className="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
            <Plus className="mr-2 h-4 w-4" /> Manage athletes
          </Link>
        </div>
      </div>

      <section className="mt-8">
        <TeamStatGrid stats={stats} />
      </section>

      <section className="mt-8 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <TeamTrendChart data={trend} />
        </div>
        <RecentActivity injuries={injuries} followUps={followUps} />
      </section>

      <section className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Your athletes</h2>
          <Link href="/coach/athletes" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-44 animate-pulse rounded-2xl border border-border bg-card" />
            ))}
          </div>
        ) : athletes.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {athletes.slice(0, 6).map((a) => <AthleteCard key={a.id} athlete={a} />)}
          </div>
        )}
      </section>
    </div>
  );
}

function RecentActivity({ injuries, followUps }: { injuries: any[]; followUps: any[] }) {
  const items = [
    ...injuries.slice(0, 4).map((i) => ({
      icon: ShieldAlert, tone: "text-destructive",
      title: `${i.athlete?.full_name || "Athlete"} — ${i.body_part}`,
      sub: `Severity ${i.severity} • ${new Date(i.date_reported).toLocaleDateString()}`,
    })),
    ...followUps.slice(0, 4).map((f) => ({
      icon: Dumbbell, tone: "text-accent",
      title: f.title, sub: `${f.athlete?.full_name || "Athlete"} • ${f.priority}`,
    })),
  ].slice(0, 6);

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <h3 className="mb-4 text-lg font-semibold">Recent activity</h3>
      {items.length === 0 ? (
        <div className="grid h-48 place-items-center text-sm text-muted-foreground">Nothing new.</div>
      ) : (
        <ul className="space-y-3">
          {items.map((it, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className={`mt-0.5 grid h-7 w-7 place-items-center rounded-lg bg-muted ${it.tone}`}>
                <it.icon className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">{it.title}</div>
                <div className="text-xs text-muted-foreground">{it.sub}</div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
        <Users className="h-5 w-5" />
      </div>
      <h3 className="mt-4 text-lg font-semibold">No athletes yet</h3>
      <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
        Once an athlete from Kotaana connects to your coach account, they'll appear here.
      </p>
      <Link href="/coach/invites" className="mt-6 inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
        Invite an athlete
      </Link>
    </div>
  );
}
