import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, Activity, TrendingUp } from "lucide-react";
import type { AthleteSummary } from "@/hooks/use-coach-data";

export function AthleteCard({ athlete }: { athlete: AthleteSummary }) {
  const initials = (athlete.full_name || athlete.email || "?")
    .split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
  const statusTone =
    athlete.relation_status === "active" ? "bg-primary/15 text-primary"
    : athlete.relation_status === "pending" ? "bg-accent/15 text-accent"
    : "bg-muted text-muted-foreground";

  return (
    <Link
      href={`/coach/athletes/${athlete.id}`}
      className="group block rounded-2xl border border-border bg-card p-5 transition hover:border-primary/40 hover:shadow-[var(--glow-primary)]"
    >
      <div className="flex items-start gap-4">
        <Avatar className="h-12 w-12">
          <AvatarImage src={athlete.avatar_url ?? undefined} />
          <AvatarFallback className="bg-primary/20 text-primary">{initials}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <div className="truncate font-medium">{athlete.full_name || "Unnamed athlete"}</div>
            <Badge className={statusTone} variant="secondary">{athlete.relation_status}</Badge>
          </div>
          <div className="truncate text-xs text-muted-foreground">{athlete.email}</div>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <Stat label="Fitness" value={athlete.fitness_score} />
            <Stat label="Recovery" value={athlete.recovery_score} />
            <Stat label="Streak" value={athlete.consistency_score} />
          </div>
          <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Activity className="h-3 w-3" /> {athlete.weight ?? "—"} kg
            </span>
            <span className="inline-flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> goal {athlete.target_weight ?? "—"} kg
            </span>
            <ChevronRight className="h-4 w-4 transition group-hover:translate-x-1" />
          </div>
        </div>
      </div>
    </Link>
  );
}

function Stat({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="rounded-xl bg-muted/30 px-2 py-2">
      <div className="font-display text-lg font-semibold leading-none">{value ?? "—"}</div>
      <div className="mt-1 text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
    </div>
  );
}
