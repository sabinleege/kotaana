"use client";

import { cn } from "@/lib/utils";

const TONE_VAR: Record<string, string> = {
  primary: "var(--color-primary)",
  accent: "var(--color-accent)",
  "chart-2": "var(--color-chart-2)",
  "chart-3": "var(--color-chart-3)",
  destructive: "var(--color-destructive)",
};

/** Circular progress ring with a centered value. */
export function Ring({
  value,
  size = 96,
  stroke = 9,
  tone = "primary",
  center,
  sub,
}: {
  value: number; // 0..1
  size?: number;
  stroke?: number;
  tone?: keyof typeof TONE_VAR | string;
  center: React.ReactNode;
  sub?: React.ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(1, value));
  const color = TONE_VAR[tone] ?? "var(--color-primary)";
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-muted)" strokeWidth={stroke} opacity={0.4} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={c} strokeDashoffset={c * (1 - clamped)} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 700ms ease" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-content-center text-center">
        <div className="text-lg font-bold leading-none">{center}</div>
        {sub && <div className="mt-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">{sub}</div>}
      </div>
    </div>
  );
}

/** Elegant stat tile with icon, value, label and optional trend. */
export function StatTile({
  icon: Icon,
  label,
  value,
  hint,
  tone = "primary",
  className,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
  hint?: string;
  tone?: keyof typeof TONE_VAR | string;
  className?: string;
}) {
  const color = TONE_VAR[tone] ?? "var(--color-primary)";
  return (
    <div className={cn("relative overflow-hidden rounded-3xl border border-border/70 bg-card p-5", className)}>
      <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full opacity-20 blur-2xl" style={{ background: color }} />
      <div className="grid h-9 w-9 place-items-center rounded-xl" style={{ background: `color-mix(in oklch, ${color} 18%, transparent)`, color }}>
        <Icon className="h-[18px] w-[18px]" />
      </div>
      <div className="mt-3 text-2xl font-bold tracking-tight">{value}</div>
      <div className="text-sm text-muted-foreground">{label}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground/80">{hint}</div>}
    </div>
  );
}

/** Card wrapper with a title. */
export function Panel({ title, action, children, className }: { title?: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-3xl border border-border/70 bg-card p-6", className)}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between">
          {title && <h2 className="text-lg font-semibold">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </div>
  );
}
