"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { useAthleteDetail } from "@/hooks/use-coach-data";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatCard } from "@/components/coach/StatCard";
import { AthleteProfileCard } from "@/components/coach/AthleteProfileCard";
import { CoachNoteEditor } from "@/components/coach/CoachNoteEditor";
import { FollowUpQueue } from "@/components/coach/FollowUpQueue";
import { ArrowLeft, Activity, Flame, Heart, Scale, ShieldAlert } from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { useInjuries, useCreateInjury } from "@/hooks/use-injuries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

export default function AthleteDetail() {
  const { athleteId } = useParams<{ athleteId: string }>();
  const { data, isLoading } = useAthleteDetail(athleteId);
  const { data: injuries = [] } = useInjuries({ athleteId });
  const p: any = data?.profile;

  if (isLoading) return <div className="mx-auto max-w-6xl">Loading…</div>;
  if (!p) return (
    <div className="mx-auto max-w-6xl">
      <BackLink />
      <div className="mt-6 rounded-2xl border border-border bg-card p-8 text-center text-muted-foreground">
        Athlete not found, or you don&apos;t have access.
      </div>
    </div>
  );

  const weightData = (data?.weights ?? []).map((w: any) => ({ label: w.week_label, weight: Number(w.weight) }));
  const activityData = (data?.activity ?? []).slice().reverse().map((a: any) => ({ day: a.day, calories: a.calories }));

  return (
    <div className="mx-auto max-w-6xl">
      <BackLink />
      <div className="mt-4">
        <AthleteProfileCard profile={p} />
      </div>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Flame} label="Fitness" value={p.fitness_score ?? "—"} />
        <StatCard icon={Heart} label="Recovery" value={p.recovery_score ?? "—"} accent="accent" />
        <StatCard icon={Activity} label="Consistency" value={(p.consistency_score ?? 0) + "%"} />
        <StatCard icon={Scale} label="Weight" value={`${p.weight ?? "—"} kg`} hint={`Goal: ${p.target_weight ?? "—"} kg`} accent="accent" />
      </section>

      <Tabs defaultValue="progress" className="mt-8">
        <TabsList>
          <TabsTrigger value="progress">Progress</TabsTrigger>
          <TabsTrigger value="workouts">Workouts</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="injuries">Injuries</TabsTrigger>
          <TabsTrigger value="follow-ups">Follow-ups</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="progress" className="mt-6">
          <ChartCard title="Weight trend">
            {weightData.length === 0 ? <Empty msg="No weight history yet." /> : (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={weightData}>
                  <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" />
                  <XAxis dataKey="label" stroke="var(--color-muted-foreground)" fontSize={12} />
                  <YAxis stroke="var(--color-muted-foreground)" fontSize={12} domain={["dataMin-2", "dataMax+2"]} />
                  <Tooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 12 }} />
                  <Line type="monotone" dataKey="weight" stroke="var(--color-primary)" strokeWidth={2.5} dot={{ r: 4, fill: "var(--color-primary)" }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </TabsContent>

        <TabsContent value="workouts" className="mt-6">
          <ChartCard title="Recent sessions">
            {(data?.workouts ?? []).length === 0 ? <Empty msg="No workouts logged." /> : (
              <ul className="divide-y divide-border">
                {(data!.workouts as any[]).map((w: any) => (
                  <li key={w.id} className="flex items-center justify-between py-3">
                    <div>
                      <div className="font-medium">{new Date(w.date).toLocaleDateString()}</div>
                      {w.notes && <div className="text-xs text-muted-foreground">{w.notes}</div>}
                    </div>
                    <div className="text-lg text-primary">{Math.round(Number(w.completion_rate))}%</div>
                  </li>
                ))}
              </ul>
            )}
          </ChartCard>
        </TabsContent>

        <TabsContent value="activity" className="mt-6">
          <ChartCard title="Calories — last 14 days">
            {activityData.length === 0 ? <Empty msg="No activity yet." /> : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={activityData}>
                  <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" />
                  <XAxis dataKey="day" stroke="var(--color-muted-foreground)" fontSize={12} />
                  <YAxis stroke="var(--color-muted-foreground)" fontSize={12} />
                  <Tooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 12 }} />
                  <Bar dataKey="calories" fill="var(--color-accent)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </TabsContent>

        <TabsContent value="injuries" className="mt-6">
          <ChartCard title={`Injuries (${injuries.length})`}>
            <div className="mb-4 flex justify-end">
              <LogInjuryDialog athleteId={athleteId} />
            </div>
            {injuries.length === 0 ? <Empty msg="No injuries logged." /> : (
              <ul className="divide-y divide-border">
                {injuries.map((i) => (
                  <li key={i.id} className="flex items-center justify-between py-3">
                    <div>
                      <div className="font-medium capitalize">{i.body_part} — {i.injury_type}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(i.date_reported).toLocaleDateString()} • Severity {i.severity}
                      </div>
                    </div>
                    <Badge variant="secondary" className="capitalize">{i.status}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </ChartCard>
        </TabsContent>

        <TabsContent value="follow-ups" className="mt-6">
          <FollowUpQueue athleteId={athleteId} />
        </TabsContent>

        <TabsContent value="notes" className="mt-6">
          <CoachNoteEditor athleteId={athleteId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function LogInjuryDialog({ athleteId }: { athleteId: string }) {
  const create = useCreateInjury();
  const [open, setOpen] = useState(false);
  const [bodyPart, setBodyPart] = useState("");
  const [injuryType, setInjuryType] = useState("");
  const [severity, setSeverity] = useState("3");
  const [expectedReturn, setExpectedReturn] = useState("");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline"><ShieldAlert className="mr-2 h-4 w-4" /> Log injury</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Log injury</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <Input placeholder="Body part (e.g. knee)" value={bodyPart} onChange={(e) => setBodyPart(e.target.value)} />
          <Input placeholder="Type (e.g. sprain)" value={injuryType} onChange={(e) => setInjuryType(e.target.value)} />
          <div className="grid grid-cols-2 gap-2">
            <Select value={severity} onValueChange={setSeverity}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5].map((n) => <SelectItem key={n} value={String(n)}>Severity {n}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input type="date" value={expectedReturn} onChange={(e) => setExpectedReturn(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            disabled={!bodyPart || !injuryType || create.isPending}
            onClick={() => create.mutate(
              {
                athlete_id: athleteId,
                body_part: bodyPart,
                injury_type: injuryType,
                severity: Number(severity),
                status: "active",
                date_reported: new Date().toISOString().slice(0, 10),
                expected_return: expectedReturn || null,
                notes: null,
                recovery_timeline: null,
              } as any,
              { onSuccess: () => { setOpen(false); setBodyPart(""); setInjuryType(""); setExpectedReturn(""); setSeverity("3"); } },
            )}
          >Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <h3 className="mb-4 text-lg font-semibold">{title}</h3>
      {children}
    </div>
  );
}

function Empty({ msg }: { msg: string }) {
  return <div className="grid h-32 place-items-center text-sm text-muted-foreground">{msg}</div>;
}

function BackLink() {
  return (
    <Link href="/coach/athletes" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
      <ArrowLeft className="h-4 w-4" /> Back to athletes
    </Link>
  );
}
