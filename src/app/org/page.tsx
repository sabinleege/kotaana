/**
 * /org — list organizations for the current user (scaffold UI)
 */
"use client";

import { useEffect, useState } from "react";

type Org = { id: string; name: string; slug: string; planType?: string; seatLimit?: number | null };

export default function OrgHomePage() {
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/orgs");
      const data = await res.json();
      setOrgs(data.organizations || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function create() {
    if (!name.trim()) return;
    setCreating(true);
    try {
      await fetch("/api/orgs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      setName("");
      await load();
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="text-3xl font-semibold">Organizations</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Multi-tenant workspaces for coaching teams.
      </p>

      <div className="mt-6 flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Team / gym name"
          className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm"
        />
        <button
          onClick={create}
          disabled={creating || !name.trim()}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          {creating ? "Creating…" : "Create"}
        </button>
      </div>

      <div className="mt-8 space-y-3">
        {loading ? (
          <div className="h-16 animate-pulse rounded-xl bg-muted/40" />
        ) : orgs.length === 0 ? (
          <p className="text-sm text-muted-foreground">No organizations yet.</p>
        ) : (
          orgs.map((o) => (
            <a
              key={o.id}
              href={`/org/${o.id}`}
              className="block rounded-2xl border border-border bg-card p-4 hover:bg-accent/5"
            >
              <div className="font-medium">{o.name}</div>
              <div className="text-xs text-muted-foreground">
                @{o.slug} · {o.planType || "free"} · seats {o.seatLimit ?? "—"}
              </div>
            </a>
          ))
        )}
      </div>
    </div>
  );
}
