"use client";

/**
 * Athlete Notifications — coach requests, AI advice, reminders, injury alerts, etc.
 */
import { useEffect, useState } from "react";
import { Bell, Check } from "lucide-react";

type Notif = {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt?: string;
  created_at?: string;
};

export default function AthleteNotificationsPage() {
  const [items, setItems] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((d) => setItems(d.notifications || d || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  async function markRead(id: string) {
    await fetch(`/api/notifications`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, read: true }),
    }).catch(() => {});
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }

  const typeLabel = (t: string) => {
    const map: Record<string, string> = {
      coach_followup: "Coach feedback",
      coach_request: "Coach request",
      ai_advice: "AI advice",
      reminder: "Reminder",
      injury: "Injury alert",
      recovery: "Recovery",
      subscription: "Subscription",
      payment: "Payment",
      tip: "Tip",
    };
    return map[t] || t || "Update";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary">
          <Bell className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-sm text-muted-foreground">
            Coach messages, AI recommendations, reminders and health alerts.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="h-24 animate-pulse rounded-2xl bg-muted/40" />
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          No notifications yet. When you connect a coach or the AI posts advice, it will show here.
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((n) => (
            <li
              key={n.id}
              className={`rounded-2xl border border-border bg-card p-4 ${n.read ? "opacity-70" : ""}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
                    {typeLabel(n.type)}
                  </div>
                  <div className="font-medium">{n.title}</div>
                  <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">{n.message}</p>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {n.createdAt || n.created_at
                      ? new Date(n.createdAt || n.created_at!).toLocaleString()
                      : ""}
                  </div>
                </div>
                {!n.read && (
                  <button
                    onClick={() => markRead(n.id)}
                    className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-xs hover:bg-accent/10"
                  >
                    <Check className="h-3 w-3" /> Mark read
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
