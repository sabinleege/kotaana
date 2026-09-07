import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { useState, useEffect } from "react";
import { useUpdateInjury, type Injury } from "@/hooks/use-injuries";

export function InjuryDetailModal({ injury, onClose }: { injury: Injury | null; onClose: () => void }) {
  const update = useUpdateInjury();
  const [notes, setNotes] = useState("");
  useEffect(() => setNotes(injury?.notes ?? ""), [injury]);
  if (!injury) return null;

  const suggestions = mockAISuggestions(injury);

  return (
    <Dialog open={!!injury} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {injury.athlete?.full_name} — {injury.body_part}
            <Badge variant="secondary">Severity {injury.severity}</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-5">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Info label="Type" value={injury.injury_type} />
            <Info label="Status" value={injury.status} />
            <Info label="Reported" value={new Date(injury.date_reported).toLocaleDateString()} />
            <Info label="Expected return" value={injury.expected_return ? new Date(injury.expected_return).toLocaleDateString() : "—"} />
          </div>

          <div>
            <div className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">Coach notes</div>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} placeholder="Recovery plan, observations…" />
            <div className="mt-2 flex justify-end">
              <Button size="sm" disabled={update.isPending} onClick={() => update.mutate({ id: injury.id, patch: { notes } })}>
                Save notes
              </Button>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-muted/30 p-4">
            <div className="mb-2 inline-flex items-center gap-2 text-xs uppercase tracking-widest text-accent">
              <Sparkles className="h-3.5 w-3.5" /> AI-suggested modified workouts
            </div>
            <ul className="space-y-1 text-sm">
              {suggestions.map((s) => <li key={s}>• {s}</li>)}
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-1 capitalize">{value}</div>
    </div>
  );
}

function mockAISuggestions(i: Injury): string[] {
  const part = i.body_part.toLowerCase();
  if (part.includes("knee")) return ["Upper-body push/pull split", "Seated cycling — light resistance", "Core stability (planks, dead bugs)"];
  if (part.includes("shoulder")) return ["Lower-body focus (squats, lunges)", "Core circuits", "Isometric grip work"];
  if (part.includes("back")) return ["Mobility flows", "Swimming or pool walking", "Light glute bridges"];
  return ["Reduce intensity by 40%", "Focus on unaffected muscle groups", "Daily mobility / stretching block"];
}
