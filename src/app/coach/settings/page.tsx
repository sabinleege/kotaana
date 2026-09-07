"use client";

import { useCoachProfile } from "@/hooks/use-coach-data";

export default function CoachSettingsPage() {
  const { data: me } = useCoachProfile();
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-3xl font-semibold">Settings</h1>
      <div className="mt-6 rounded-2xl border border-border bg-card p-6">
        <div className="grid gap-1">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Account</div>
          <div className="font-medium">{me?.full_name || "—"}</div>
          <div className="text-sm text-muted-foreground">{me?.email}</div>
        </div>
      </div>
      <p className="mt-4 text-xs text-muted-foreground">
        More coach settings coming soon (notification rules, alert thresholds, integrations).
      </p>
    </div>
  );
}
