"use client";

import { useMemo, useState } from "react";
import { useMyAthletes } from "@/hooks/use-coach-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BarChart3, Download } from "lucide-react";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";

const COLORS = ["var(--color-primary)", "var(--color-accent)", "#a78bfa", "#fbbf24", "#f87171"];

export default function AnalyticsPage() {
  const { data: athletes = [] } = useMyAthletes();
  const today = new Date().toISOString().slice(0, 10);
  const monthAgo = new Date(Date.now() - 30 * 86400_000).toISOString().slice(0, 10);
  const [from, setFrom] = useState(monthAgo);
  const [to, setTo] = useState(today);

  const goalDist = useMemo(() => {
    const map = new Map<string, number>();
    athletes.forEach((a) => {
      const g = (a as any).primary_goal || "Unspecified";
      map.set(g, (map.get(g) ?? 0) + 1);
    });
    return Array.from(map, ([name, value]) => ({ name, value }));
  }, [athletes]);

  const buckets = useMemo(() => {
    const b = [0, 0, 0, 0, 0];
    athletes.forEach((a) => {
      const v = a.consistency_score ?? 0;
      const idx = Math.min(4, Math.floor(v / 20));
      b[idx]++;
    });
    return b.map((count, i) => ({ range: `${i * 20}-${i * 20 + 20}%`, count }));
  }, [athletes]);

  function exportCsv() {
    const header = "name,email,fitness,recovery,consistency,weight,target_weight\n";
    const rows = athletes.map((a) =>
      [a.full_name, a.email, a.fitness_score, a.recovery_score, a.consistency_score, a.weight, a.target_weight]
        .map((v) => `"${v ?? ""}"`).join(","),
    ).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `athletes-${from}-to-${to}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
            <BarChart3 className="h-5 w-5" />
          </span>
          <div>
            <div className="text-sm text-muted-foreground">Insights</div>
            <h1 className="text-3xl font-semibold">Analytics</h1>
          </div>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <div>
            <div className="mb-1 text-[10px] uppercase tracking-widest text-muted-foreground">From</div>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-40" />
          </div>
          <div>
            <div className="mb-1 text-[10px] uppercase tracking-widest text-muted-foreground">To</div>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-40" />
          </div>
          <Button onClick={exportCsv}><Download className="mr-2 h-4 w-4" /> Export CSV</Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-6">
          <h3 className="mb-4 text-lg font-semibold">Goal distribution</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={goalDist} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={4}>
                {goalDist.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <h3 className="mb-4 text-lg font-semibold">Adherence distribution</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={buckets}>
              <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" />
              <XAxis dataKey="range" stroke="var(--color-muted-foreground)" fontSize={12} />
              <YAxis stroke="var(--color-muted-foreground)" fontSize={12} allowDecimals={false} />
              <Tooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 12 }} />
              <Bar dataKey="count" fill="var(--color-primary)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
