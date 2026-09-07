"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPatch } from "@/lib/fetcher";
import { Bell, Check } from "lucide-react";

type Notification = {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
};

export default function CoachNotificationsPage() {
  const qc = useQueryClient();
  const { data: items = [] } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => apiGet<Notification[]>("/api/notifications"),
  });
  const markAll = useMutation({
    mutationFn: () => apiPatch("/api/notifications", { markAllRead: true }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold">Notifications</h1>
        {items.some((n) => !n.read) && (
          <button
            onClick={() => markAll.mutate()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-accent/10"
          >
            <Check className="h-4 w-4" /> Mark all read
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="mt-6 grid place-items-center rounded-2xl border border-dashed border-border bg-card p-16 text-center">
          <Bell className="h-8 w-8 text-muted-foreground" />
          <p className="mt-4 text-sm text-muted-foreground">No new notifications.</p>
        </div>
      ) : (
        <ul className="mt-6 space-y-2">
          {items.map((n) => (
            <li
              key={n.id}
              className={`rounded-xl border border-border p-4 ${n.read ? "bg-card/50" : "bg-card"}`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="font-medium">{n.title}</div>
                {!n.read && <span className="h-2 w-2 rounded-full bg-primary" />}
              </div>
              <div className="mt-1 text-sm text-muted-foreground">{n.message}</div>
              <div className="mt-1 text-xs text-muted-foreground">
                {new Date(n.created_at).toLocaleString()}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
