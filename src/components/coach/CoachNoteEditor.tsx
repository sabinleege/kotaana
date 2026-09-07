import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Trash2, Eye, EyeOff } from "lucide-react";
import { useCoachNotes, useCreateCoachNote, useDeleteCoachNote } from "@/hooks/use-coach-notes";

export function CoachNoteEditor({ athleteId }: { athleteId: string }) {
  const { data: notes = [], isLoading } = useCoachNotes(athleteId);
  const create = useCreateCoachNote();
  const del = useDeleteCoachNote();
  const [content, setContent] = useState("");
  const [visible, setVisible] = useState(false);

  function save() {
    if (!content.trim()) return;
    create.mutate(
      { athlete_id: athleteId, content: content.trim(), visible_to_athlete: visible },
      { onSuccess: () => { setContent(""); setVisible(false); } },
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-card p-5">
        <Label className="text-xs uppercase tracking-widest text-muted-foreground">New note</Label>
        <Textarea
          className="mt-2"
          rows={4}
          placeholder="Observations, plan adjustments, recognition…"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <Switch id="visible" checked={visible} onCheckedChange={setVisible} />
            <Label htmlFor="visible" className="cursor-pointer">
              {visible ? <Eye className="mr-1 inline h-3.5 w-3.5" /> : <EyeOff className="mr-1 inline h-3.5 w-3.5" />}
              Visible to athlete
            </Label>
          </div>
          <Button onClick={save} disabled={!content.trim() || create.isPending}>Save note</Button>
        </div>
      </div>

      <div>
        <div className="mb-3 text-xs uppercase tracking-widest text-muted-foreground">History</div>
        {isLoading ? (
          <div className="text-sm text-muted-foreground">Loading…</div>
        ) : notes.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
            No notes yet.
          </div>
        ) : (
          <ul className="space-y-3">
            {notes.map((n) => (
              <li key={n.id} className="rounded-2xl border border-border bg-card p-4">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{new Date(n.created_at).toLocaleString()}</span>
                  <div className="flex items-center gap-2">
                    {n.visible_to_athlete && (
                      <span className="inline-flex items-center gap-1 text-accent"><Eye className="h-3 w-3" /> Shared</span>
                    )}
                    <button onClick={() => del.mutate(n.id)} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm">{n.content}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
