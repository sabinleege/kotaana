"use client";

import { useEffect, useState } from "react";

type Member = {
  athleteId: string;
  name: string;
  email?: string;
  status: string; // active | paused
  since?: string;
};

export default function CoachMembersSettingsPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  function load() {
    fetch("/api/coach/members")
      .then((r) => r.json())
      .then((d) => setMembers(d.members || []))
      .catch(() => setMembers([]));
  }

  useEffect(() => {
    load();
  }, []);

  async function toggle(athleteId: string, next: "active" | "paused") {
    await fetch(`/api/coach/members`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ athleteId, status: next }),
    });
    load();
  }

  async function addMember() {
    setMsg(null);
    const res = await fetch("/api/coach/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMsg(data.error || "Failed");
      return;
    }
    setMsg(data.message || "Invite sent");
    setEmail("");
    load();
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-3xl font-semibold">Members management</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Turn management on/off per athlete. Off stops monitoring without deleting history.
      </p>

      <div className="mt-6 rounded-2xl border border-border bg-card p-4">
        <h2 className="font-medium">Add member</h2>
        <div className="mt-2 flex gap-2">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="athlete@email.com"
            className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm"
          />
          <button
            onClick={addMember}
            className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"
          >
            Invite
          </button>
        </div>
        {msg && <p className="mt-2 text-sm text-muted-foreground">{msg}</p>}
      </div>

      <div className="mt-6 space-y-2">
        {members.map((m) => (
          <div
            key={m.athleteId}
            className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3"
          >
            <div>
              <div className="font-medium">{m.name}</div>
              <div className="text-xs text-muted-foreground">
                {m.email} · {m.status}
              </div>
            </div>
            <button
              onClick={() => toggle(m.athleteId, m.status === "active" ? "paused" : "active")}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                m.status === "active"
                  ? "bg-green-500/15 text-green-700"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {m.status === "active" ? "On — managing" : "Off — paused"}
            </button>
          </div>
        ))}
        {members.length === 0 && (
          <p className="text-sm text-muted-foreground">No members yet.</p>
        )}
      </div>

      <div className="mt-8 flex gap-3 text-sm">
        <a href="/coach/settings/payment" className="text-primary">
          Payment & MoMo →
        </a>
      </div>
    </div>
  );
}
