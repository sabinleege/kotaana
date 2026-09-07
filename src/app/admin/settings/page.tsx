"use client";

import { useEffect, useState } from "react";
import { apiGet, apiPatch } from "@/lib/fetcher";
import { toast } from "sonner";

export default function AdminPlatformSettingsPage() {
  const [code, setCode] = useState("8787");
  const [name, setName] = useState("Kotaana");
  const [instructions, setInstructions] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiGet<{ code: string; name: string; instructions: string }>("/api/owner/platform-momo")
      .then((d) => {
        setCode(d.code || "8787");
        setName(d.name || "Kotaana");
        setInstructions(d.instructions || "");
      })
      .catch(() => {
        // fallback public endpoint
        apiGet<{ code: string; name: string; instructions: string }>("/api/platform/momo")
          .then((d) => {
            setCode(d.code);
            setName(d.name);
            setInstructions(d.instructions || "");
          })
          .catch(() => {});
      });
  }, []);

  async function save() {
    setLoading(true);
    try {
      await apiPatch("/api/owner/platform-momo", { code, name, instructions });
      toast.success("Saved — athletes and coaches will see this when paying the app");
    } catch (e: any) {
      toast.error(e?.message || "Failed (need admin role)");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Platform MoMo</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Once set, every athlete and coach sees this code on their subscription / pay screen (same idea as coach MoMo when searched).
        </p>
      </div>
      <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
        <label className="text-xs font-medium text-muted-foreground">MoMo code</label>
        <input
          className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="8787"
        />
        <label className="text-xs font-medium text-muted-foreground">Account name</label>
        <input
          className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Kotaana"
        />
        <label className="text-xs font-medium text-muted-foreground">Instructions (optional)</label>
        <textarea
          className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
          rows={3}
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          placeholder="How users should pay and what to put in the reference…"
        />
        <button
          type="button"
          onClick={save}
          disabled={loading}
          className="w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
        >
          {loading ? "Saving…" : "Save — show to all users & coaches"}
        </button>
      </div>
    </div>
  );
}
