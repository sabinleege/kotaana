"use client";

/**
 * AI + rule recommendations — coach creates follow-up → athlete notification
 */
import { useEffect, useState } from "react";
import { EmptyState } from "@/components/EmptyState";
import { Sparkles } from "lucide-react";

type Item = {
  athleteId: string;
  name: string;
  priority: "low" | "normal" | "high";
  issues: string[];
  suggestedAction: string;
  tags: string[];
};

export default function CoachRecommendationsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  function load() {
    fetch("/api/coach/recommendations")
      .then((r) => r.json())
      .then((d) => setItems(d.recommendations || []))
      .catch(() => setItems([]));
  }

  useEffect(() => {
    load();
  }, []);

  async function createFollowUp(item: Item) {
    setBusy(item.athleteId);
    setMsg(null);
    try {
      const res = await fetch("/api/coach/follow-ups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          athleteId: item.athleteId,
          title: `Follow-up: ${item.tags[0] || "check-in"}`,
          description: `${item.suggestedAction}\n\nIssues:\n- ${item.issues.join("\n- ")}`,
          priority: item.priority,
          notifyAthlete: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setMsg(`Follow-up sent to ${item.name}. They will see a notification in their app.`);
    } catch (e: any) {
      setMsg(e.message || "Error");
    } finally {
      setBusy(null);
    }
  }

  const badge = (p: string) =>
    p === "high"
      ? "bg-red-500/15 text-red-600"
      : p === "normal"
        ? "bg-amber-500/15 text-amber-700"
        : "bg-muted text-muted-foreground";

  return (
    <div>
      <h1 className="text-3xl font-semibold">Recommendations</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        AI + rules flag what is not fine. Click follow-up to notify the athlete.
      </p>

      {msg && (
        <div className="mt-4 rounded-xl border border-border bg-card px-4 py-3 text-sm">{msg}</div>
      )}

      <div className="mt-6 space-y-3">
        {items.map((item) => (
          <div key={item.athleteId + item.issues[0]} className="rounded-2xl border border-border bg-card p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{item.name}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs ${badge(item.priority)}`}>
                    {item.priority}
                  </span>
                </div>
                <ul className="mt-2 list-disc pl-5 text-sm text-muted-foreground">
                  {item.issues.map((i) => (
                    <li key={i}>{i}</li>
                  ))}
                </ul>
                <p className="mt-2 text-sm">
                  <span className="text-muted-foreground">Suggested: </span>
                  {item.suggestedAction}
                </p>
              </div>
              <button
                disabled={busy === item.athleteId}
                onClick={() => createFollowUp(item)}
                className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
              >
                {busy === item.athleteId ? "Sending…" : "Create follow-up"}
              </button>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <EmptyState
            icon={Sparkles}
            title="No recommendations"
            description="Athletes look stable. Flags appear for injuries, low readiness, or missed adherence."
          />
        )}
      </div>
    </div>
  );
}
