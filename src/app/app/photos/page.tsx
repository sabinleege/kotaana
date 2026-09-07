"use client";

import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiGet, apiPost, apiDelete } from "@/lib/fetcher";
import { PhotoCapture } from "@/components/PhotoCapture";
import { Panel } from "@/components/athlete/ui";
import { Camera, Trash2, Sparkles, Loader2, TrendingUp } from "lucide-react";

type Photo = { id: string; date: string; pose: "front" | "side" | "back"; image_url: string; weight: number | null };
const POSES = ["front", "side", "back"] as const;

export default function ProgressPhotosPage() {
  const qc = useQueryClient();
  const { data: photos = [] } = useQuery({ queryKey: ["progress-photos"], queryFn: () => apiGet<Photo[]>("/api/progress-photos") });
  const [pose, setPose] = useState<(typeof POSES)[number]>("front");
  const [uploading, setUploading] = useState(false);

  const del = useMutation({
    mutationFn: (id: string) => apiDelete(`/api/progress-photos/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["progress-photos"] }),
  });

  async function upload(dataUrl: string) {
    setUploading(true);
    try {
      await apiPost("/api/progress-photos", { pose, image: dataUrl });
      toast.success("Progress photo saved");
      qc.invalidateQueries({ queryKey: ["progress-photos"] });
    } catch (e: any) { toast.error(e.message); }
    finally { setUploading(false); }
  }

  // Photos of the current pose, oldest → newest (for comparison).
  const posePhotos = useMemo(
    () => photos.filter((p) => p.pose === pose).slice().sort((a, b) => a.date.localeCompare(b.date)),
    [photos, pose],
  );

  const [comparison, setComparison] = useState<any>(null);
  const [comparing, setComparing] = useState(false);
  async function compare() {
    if (posePhotos.length < 2) { toast.error("Upload at least two photos of this pose to compare"); return; }
    setComparing(true); setComparison(null);
    try {
      const res = await apiPost<{ comparison: any; span_days: number }>("/api/ai/photo-compare", {
        from_id: posePhotos[0].id,
        to_id: posePhotos[posePhotos.length - 1].id,
      });
      setComparison({ ...res.comparison, span: res.span_days });
    } catch (e: any) { toast.error(e.message); }
    finally { setComparing(false); }
  }

  const toneCls: Record<string, string> = { improved: "var(--color-primary)", similar: "var(--color-accent)", regressed: "var(--color-destructive)" };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary"><Camera className="h-5 w-5" /></span>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Progress Photos</h1>
          <p className="text-sm text-muted-foreground">Front, side &amp; back — the AI compares your oldest and newest to show real change.</p>
        </div>
      </div>

      {/* pose tabs + upload */}
      <Panel>
        <div className="mb-4 grid grid-cols-3 gap-1 rounded-xl bg-muted p-1 text-sm">
          {POSES.map((p) => (
            <button key={p} onClick={() => { setPose(p); setComparison(null); }}
              className={`rounded-lg py-2 font-medium capitalize transition ${pose === p ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
              {p}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <PhotoCapture onCapture={upload} busy={uploading} label={uploading ? "Saving…" : `Add ${pose} photo`} preview={false} />
          <button onClick={compare} disabled={comparing || posePhotos.length < 2}
            className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm hover:bg-accent/10 disabled:opacity-50">
            {comparing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-primary" />} Compare progress
          </button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">Private to you. Tip: same lighting, distance &amp; pose each time.</p>
      </Panel>

      {comparison && (
        <Panel title={`AI comparison · ${comparison.span} days`}>
          <p className="text-sm">{comparison.summary}</p>
          {comparison.areas?.length ? (
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {comparison.areas.map((a: any, i: number) => (
                <div key={i} className="rounded-xl border border-border p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium capitalize">{a.area}</span>
                    <span className="rounded-full px-2 py-0.5 text-[11px] font-medium capitalize" style={{ background: `color-mix(in oklch, ${toneCls[a.change]} 16%, transparent)`, color: toneCls[a.change] }}>{a.change}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{a.note}</p>
                </div>
              ))}
            </div>
          ) : null}
          {comparison.encouragement && (
            <p className="mt-4 flex items-start gap-2 rounded-xl bg-primary/10 p-3 text-sm text-primary"><TrendingUp className="mt-0.5 h-4 w-4 shrink-0" />{comparison.encouragement}</p>
          )}
        </Panel>
      )}

      {/* timeline */}
      <Panel title={`${pose[0].toUpperCase() + pose.slice(1)} timeline`}>
        {posePhotos.length === 0 ? (
          <div className="grid h-32 place-items-center text-sm text-muted-foreground">No {pose} photos yet.</div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {posePhotos.slice().reverse().map((p) => (
              <div key={p.id} className="group relative overflow-hidden rounded-2xl border border-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.image_url} alt={`${p.pose} ${p.date}`} className="aspect-[3/4] w-full object-cover" />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2 text-[11px] text-white">
                  {new Date(p.date).toLocaleDateString()}{p.weight ? ` · ${p.weight}kg` : ""}
                </div>
                <button onClick={() => del.mutate(p.id)} className="absolute right-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-lg bg-black/50 text-white opacity-0 transition group-hover:opacity-100" aria-label="Delete">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}
