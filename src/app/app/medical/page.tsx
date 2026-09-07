"use client";

import { useEffect, useState } from "react";
import { FileText, Upload } from "lucide-react";
import { Panel } from "@/components/athlete/ui";
import { apiGet, apiPost } from "@/lib/fetcher";
import { toast } from "sonner";

type Doc = {
  id: string;
  docType: string;
  title?: string | null;
  aiSummary?: string | null;
  createdAt: string;
};

export default function MedicalDocsPage() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [docType, setDocType] = useState("blood");
  const [title, setTitle] = useState("");
  const [ocrText, setOcrText] = useState("");
  const [fileUrl, setFileUrl] = useState("uploaded://local");
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      const data = await apiGet<{ documents: Doc[] }>("/api/ai/medical-doc");
      setDocs(data.documents || []);
    } catch {
      setDocs([]);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await apiPost("/api/ai/medical-doc", {
        docType,
        title: title || docType,
        fileUrl,
        ocrText: ocrText || undefined,
      });
      toast.success("Document analyzed (coaching summary only — not a diagnosis)");
      setTitle("");
      setOcrText("");
      await load();
    } catch (err: any) {
      toast.error(err?.message || "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <FileText className="h-6 w-6 text-primary" /> Medical documents
        </h1>
        <p className="text-sm text-muted-foreground">
          Upload notes or paste report text for an AI coaching summary. Not medical advice — see{" "}
          <a className="text-primary underline" href="/legal/medical">disclaimer</a>.
        </p>
      </div>

      <Panel className="p-4">
        <form onSubmit={submit} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              className="rounded-xl border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="blood">Blood report</option>
              <option value="xray">X-ray</option>
              <option value="mri">MRI</option>
              <option value="ct">CT</option>
              <option value="other">Other</option>
            </select>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title (optional)"
              className="rounded-xl border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
          <input
            value={fileUrl}
            onChange={(e) => setFileUrl(e.target.value)}
            placeholder="File URL or reference"
            className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
          />
          <textarea
            value={ocrText}
            onChange={(e) => setOcrText(e.target.value)}
            placeholder="Paste report text / OCR output (recommended for better summary)"
            rows={5}
            className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            <Upload className="h-4 w-4" /> {busy ? "Analyzing…" : "Save & summarize"}
          </button>
        </form>
      </Panel>

      <div className="space-y-3">
        {docs.length === 0 ? (
          <p className="text-sm text-muted-foreground">No documents yet.</p>
        ) : (
          docs.map((d) => (
            <Panel key={d.id} className="p-4 space-y-1">
              <div className="text-sm font-medium">
                {d.title || d.docType} <span className="text-xs font-normal text-muted-foreground">({d.docType})</span>
              </div>
              <div className="text-[11px] text-muted-foreground">{new Date(d.createdAt).toLocaleString()}</div>
              <p className="text-xs text-muted-foreground leading-relaxed">{d.aiSummary || "No summary"}</p>
            </Panel>
          ))
        )}
      </div>
    </div>
  );
}
