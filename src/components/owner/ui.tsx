"use client";

/**
 * Owner dashboard primitives.
 *
 * The owner screens are read-mostly control surfaces, so these lean on state
 * you can see at a glance — a status dot, a severity tone — rather than the
 * athlete app's rings and gradients.
 */

import type { LucideIcon } from "lucide-react";

export function PageHead({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}

export function MetricTile({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  icon?: LucideIcon;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
        <div className="text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
      </div>
      <div className="mt-2 text-3xl font-bold tabular-nums">{value}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

export function Panel({
  title,
  description,
  children,
  right,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
        </div>
        {right}
      </div>
      {children}
    </section>
  );
}

export function StatusDot({ ok, className = "" }: { ok: boolean; className?: string }) {
  return (
    <span
      aria-hidden
      className={`inline-block h-2 w-2 shrink-0 rounded-full ${
        ok ? "bg-primary" : "bg-destructive"
      } ${className}`}
    />
  );
}

export function RoleBadge({ role }: { role: string }) {
  const tone =
    role === "admin"
      ? "border-[color:var(--color-accent)] text-[color:var(--color-accent)]"
      : role === "coach"
        ? "border-[color:var(--color-chart-3)] text-[color:var(--color-chart-3)]"
        : "border-border text-muted-foreground";
  const label = role === "admin" ? "Owner" : role === "coach" ? "Coach" : "Athlete";
  return (
    <span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${tone}`}>
      {label}
    </span>
  );
}

/** Inline bar for ranked lists — no chart library needed for a single dimension. */
export function Meter({ value, max, tone = "primary" }: { value: number; max: number; tone?: string }) {
  const pct = max > 0 ? Math.max(2, Math.round((value / max) * 100)) : 0;
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
      <div
        className="h-full rounded-full"
        style={{ width: `${pct}%`, background: `var(--color-${tone})` }}
      />
    </div>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="py-6 text-center text-sm text-muted-foreground">{children}</p>;
}

export function Loading() {
  return <div className="h-32 animate-pulse rounded-2xl bg-muted/40" />;
}

export function ErrorNote({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
      {message}
    </div>
  );
}
