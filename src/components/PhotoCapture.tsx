"use client";

import { useRef, useState } from "react";
import { Camera, Loader2, X } from "lucide-react";

/** Downscale an image file to a JPEG data URL (max edge ~1024px) to keep AI payloads small. */
async function toDataUrl(file: File, maxEdge = 1024): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", 0.82);
}

export function PhotoCapture({
  onCapture,
  label = "Take / upload photo",
  busy = false,
  preview: showPreview = true,
}: {
  onCapture: (dataUrl: string) => void;
  label?: string;
  busy?: boolean;
  preview?: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handle(file?: File) {
    if (!file) return;
    setLoading(true);
    try {
      const url = await toDataUrl(file);
      if (showPreview) setPreview(url);
      onCapture(url);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => handle(e.target.files?.[0])}
      />
      {preview ? (
        <div className="relative inline-block">
          <img src={preview} alt="capture" className="h-32 w-32 rounded-2xl object-cover" />
          <button
            onClick={() => { setPreview(null); if (ref.current) ref.current.value = ""; }}
            className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full bg-card text-muted-foreground shadow hover:text-destructive"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => ref.current?.click()}
          disabled={busy || loading}
          className="inline-flex items-center gap-2 rounded-xl border border-dashed border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground transition hover:border-primary/40 hover:text-foreground disabled:opacity-50"
        >
          {loading || busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
          {label}
        </button>
      )}
    </div>
  );
}
