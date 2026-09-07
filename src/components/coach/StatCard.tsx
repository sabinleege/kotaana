import { LucideIcon } from "lucide-react";

export function StatCard({
  icon: Icon, label, value, hint, accent = "primary",
}: {
  icon: LucideIcon; label: string; value: React.ReactNode; hint?: string;
  accent?: "primary" | "accent" | "destructive";
}) {
  const tone = {
    primary: "text-primary bg-primary/10",
    accent: "text-accent bg-accent/10",
    destructive: "text-destructive bg-destructive/10",
  }[accent];
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
        <span className={`grid h-9 w-9 place-items-center rounded-xl ${tone}`}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <div className="mt-4 font-display text-3xl font-semibold">{value}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}
