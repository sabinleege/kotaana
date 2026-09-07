import { LucideIcon, ArrowUp, ArrowDown, Minus } from "lucide-react";

export type TeamStat = {
  icon: LucideIcon;
  label: string;
  value: React.ReactNode;
  hint?: string;
  trend?: number; // % delta vs previous period
  accent?: "primary" | "accent" | "destructive";
};

export function TeamStatGrid({ stats }: { stats: TeamStat[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {stats.map((s) => (
        <Card key={s.label} stat={s} />
      ))}
    </div>
  );
}

function Card({ stat }: { stat: TeamStat }) {
  const tone = {
    primary: "text-primary bg-primary/10",
    accent: "text-accent bg-accent/10",
    destructive: "text-destructive bg-destructive/10",
  }[stat.accent ?? "primary"];
  const TrendIcon = stat.trend == null ? Minus : stat.trend > 0 ? ArrowUp : stat.trend < 0 ? ArrowDown : Minus;
  const trendTone =
    stat.trend == null ? "text-muted-foreground" : stat.trend > 0 ? "text-primary" : stat.trend < 0 ? "text-destructive" : "text-muted-foreground";

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{stat.label}</span>
        <span className={`grid h-9 w-9 place-items-center rounded-xl ${tone}`}>
          <stat.icon className="h-4 w-4" />
        </span>
      </div>
      <div className="mt-4 flex items-end justify-between">
        <div className="font-display text-3xl font-semibold leading-none">{stat.value}</div>
        {stat.trend != null && (
          <div className={`inline-flex items-center gap-1 text-xs ${trendTone}`}>
            <TrendIcon className="h-3.5 w-3.5" />
            {Math.abs(stat.trend)}%
          </div>
        )}
      </div>
      {stat.hint && <div className="mt-2 text-xs text-muted-foreground">{stat.hint}</div>}
    </div>
  );
}
