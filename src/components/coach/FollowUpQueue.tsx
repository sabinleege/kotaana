import { useState } from "react";
import { useFollowUps, useCreateFollowUp, useUpdateFollowUp, type FollowUp } from "@/hooks/use-follow-ups";
import { useMyAthletes } from "@/hooks/use-coach-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Check, Clock } from "lucide-react";

const priorityTone = {
  low: "bg-muted text-muted-foreground",
  normal: "bg-accent/15 text-accent",
  high: "bg-destructive/15 text-destructive",
};

export function FollowUpQueue({ athleteId }: { athleteId?: string }) {
  const { data: items = [], isLoading } = useFollowUps({ athleteId, status: "pending" });
  const update = useUpdateFollowUp();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-semibold">Pending follow-ups</h2>
        <NewFollowUpDialog defaultAthleteId={athleteId} />
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
          All caught up. No pending follow-ups.
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((f) => <Row key={f.id} f={f} onDone={() => update.mutate({ id: f.id, patch: { status: "done" } })} />)}
        </ul>
      )}
    </div>
  );
}

function Row({ f, onDone }: { f: FollowUp; onDone: () => void }) {
  const initials = (f.athlete?.full_name || "?").split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase();
  const overdue = f.due_date && new Date(f.due_date) < new Date();
  return (
    <li className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4">
      <Avatar className="h-9 w-9">
        <AvatarImage src={f.athlete?.avatar_url ?? undefined} />
        <AvatarFallback className="bg-primary/20 text-primary text-xs">{initials}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium">{f.title}</span>
          <Badge variant="secondary" className={priorityTone[f.priority]}>{f.priority}</Badge>
          {f.due_date && (
            <span className={`inline-flex items-center gap-1 text-xs ${overdue ? "text-destructive" : "text-muted-foreground"}`}>
              <Clock className="h-3 w-3" /> {new Date(f.due_date).toLocaleDateString()}
            </span>
          )}
        </div>
        <div className="mt-0.5 text-xs text-muted-foreground">{f.athlete?.full_name}</div>
        {f.description && <p className="mt-2 text-sm text-muted-foreground">{f.description}</p>}
      </div>
      <Button size="sm" variant="ghost" onClick={onDone}><Check className="h-4 w-4" /></Button>
    </li>
  );
}

function NewFollowUpDialog({ defaultAthleteId }: { defaultAthleteId?: string }) {
  const { data: athletes = [] } = useMyAthletes();
  const create = useCreateFollowUp();
  const [open, setOpen] = useState(false);
  const [athleteId, setAthleteId] = useState(defaultAthleteId ?? "");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"low" | "normal" | "high">("normal");
  const [dueDate, setDueDate] = useState("");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="mr-2 h-4 w-4" /> New follow-up</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Add follow-up</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          {!defaultAthleteId && (
            <Select value={athleteId} onValueChange={setAthleteId}>
              <SelectTrigger><SelectValue placeholder="Select athlete" /></SelectTrigger>
              <SelectContent>
                {athletes.map((a) => <SelectItem key={a.id} value={a.id}>{a.full_name || a.email}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
          <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Textarea placeholder="Notes (optional)" value={description} onChange={(e) => setDescription(e.target.value)} />
          <div className="grid grid-cols-2 gap-2">
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            <Select value={priority} onValueChange={(v) => setPriority(v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            disabled={!athleteId || !title || create.isPending}
            onClick={() => create.mutate(
              { athlete_id: athleteId, title, description: description || null, due_date: dueDate || null, priority },
              { onSuccess: () => { setOpen(false); setTitle(""); setDescription(""); setDueDate(""); } },
            )}
          >Add</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
