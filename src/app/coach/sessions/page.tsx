"use client";

import { useState } from "react";
import { format } from "date-fns";
import { CalendarDays, MapPin, Plus, Users as UsersIcon } from "lucide-react";
import { useSessions, useCreateSession, useUpdateSession } from "@/hooks/use-sessions";
import { useMyAthletes } from "@/hooks/use-coach-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";

export default function SessionsPage() {
  const { data: sessions = [], isLoading } = useSessions();
  const update = useUpdateSession();

  return (
    <div className="mx-auto max-w-7xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-sm text-muted-foreground">Schedule</div>
          <h1 className="text-3xl font-semibold">Sessions ({sessions.length})</h1>
        </div>
        <CreateSessionDialog />
      </div>

      {isLoading ? (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {[...Array(4)].map((_, i) => <div key={i} className="h-32 animate-pulse rounded-2xl border border-border bg-card" />)}
        </div>
      ) : sessions.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-border bg-card p-12 text-center text-muted-foreground">
          No sessions scheduled. Create one to get started.
        </div>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {sessions.map((s) => (
            <Card key={s.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-semibold">{s.title}</div>
                  <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><CalendarDays className="h-3 w-3" />{format(new Date(s.scheduled_at), "MMM d, p")}</span>
                    {s.location && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{s.location}</span>}
                    <span className="inline-flex items-center gap-1"><UsersIcon className="h-3 w-3" />{s.athlete_ids.length}</span>
                  </div>
                </div>
                <Badge variant={s.status === "completed" ? "default" : s.status === "cancelled" ? "destructive" : "secondary"}>
                  {s.status}
                </Badge>
              </div>
              {s.notes && <p className="mt-3 text-sm text-muted-foreground">{s.notes}</p>}
              <div className="mt-3 flex gap-2">
                {s.status === "scheduled" && (
                  <>
                    <Button size="sm" variant="outline" onClick={() => update.mutate({ id: s.id, status: "completed" })}>
                      Mark complete
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => update.mutate({ id: s.id, status: "cancelled" })}>
                      Cancel
                    </Button>
                  </>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function CreateSessionDialog() {
  const create = useCreateSession();
  const { data: athletes = [] } = useMyAthletes();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [duration, setDuration] = useState(60);
  const [location, setLocation] = useState("");
  const [type, setType] = useState<"training" | "court" | "assessment" | "recovery" | "team">("training");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [notes, setNotes] = useState("");

  function toggle(id: string) {
    const n = new Set(selected);
    n.has(id) ? n.delete(id) : n.add(id);
    setSelected(n);
  }

  async function submit() {
    if (!title || !scheduledAt) return;
    await create.mutateAsync({
      title,
      scheduled_at: new Date(scheduledAt).toISOString(),
      duration_minutes: duration,
      location: location || null,
      session_type: type,
      athlete_ids: Array.from(selected),
      notes: notes || null,
      status: "scheduled",
    });
    setOpen(false);
    setTitle(""); setScheduledAt(""); setLocation(""); setNotes(""); setSelected(new Set());
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="mr-2 h-4 w-4" /> New session</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Create session</DialogTitle></DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Morning strength session" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label>Date &amp; time</Label>
              <Input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Duration (min)</Label>
              <Input type="number" value={duration} onChange={(e) => setDuration(Number(e.target.value))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label>Type</Label>
              <Select value={type} onValueChange={(v: any) => setType(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="training">Training</SelectItem>
                  <SelectItem value="court">Court booking</SelectItem>
                  <SelectItem value="assessment">Assessment</SelectItem>
                  <SelectItem value="recovery">Recovery</SelectItem>
                  <SelectItem value="team">Team</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Location</Label>
              <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Court 3" />
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Athletes ({selected.size})</Label>
            <div className="max-h-40 overflow-y-auto rounded-lg border border-border p-2">
              {athletes.length === 0 ? (
                <div className="p-2 text-xs text-muted-foreground">No athletes on roster yet.</div>
              ) : athletes.map((a) => (
                <label key={a.id} className="flex cursor-pointer items-center gap-2 rounded p-1.5 hover:bg-muted">
                  <Checkbox checked={selected.has(a.id)} onCheckedChange={() => toggle(a.id)} />
                  <span className="text-sm">{a.full_name || a.email}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit} disabled={create.isPending || !title || !scheduledAt}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
