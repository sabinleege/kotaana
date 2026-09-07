"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Search, AlertTriangle } from "lucide-react";
import { useMyAthletes, type AthleteSummary } from "@/hooks/use-coach-data";
import { useInjuries } from "@/hooks/use-injuries";
import { cn } from "@/lib/utils";

export function AthleteRosterList({ collapsed }: { collapsed?: boolean }) {
  const { data: athletes = [] } = useMyAthletes();
  const { data: injuries = [] } = useInjuries({ activeOnly: true });
  const [q, setQ] = useState("");
  const path = usePathname();

  const injuredIds = useMemo(() => new Set(injuries.map((i) => i.athlete_id)), [injuries]);
  const filtered = useMemo(
    () =>
      athletes.filter(
        (a) =>
          (a.full_name || "").toLowerCase().includes(q.toLowerCase()) ||
          (a.email || "").toLowerCase().includes(q.toLowerCase()),
      ),
    [athletes, q],
  );

  if (collapsed) return null;

  return (
    <div className="px-2 pb-3">
      <div className="relative mb-2">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search roster…"
          className="h-8 pl-8 text-xs"
        />
      </div>
      <ul className="max-h-[42vh] space-y-0.5 overflow-y-auto pr-1">
        {filtered.length === 0 && (
          <li className="px-2 py-3 text-center text-[11px] text-muted-foreground">No athletes</li>
        )}
        {filtered.map((a) => (
          <RosterRow key={a.id} athlete={a} active={path.includes(`/athletes/${a.id}`)} injured={injuredIds.has(a.id)} />
        ))}
      </ul>
    </div>
  );
}

function RosterRow({ athlete, active, injured }: { athlete: AthleteSummary; active: boolean; injured: boolean }) {
  const initials = (athlete.full_name || athlete.email || "?")
    .split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
  const adherence = athlete.consistency_score ?? 0;
  const tone = adherence >= 75 ? "bg-primary" : adherence >= 50 ? "bg-accent" : "bg-destructive";

  return (
    <li>
      <Link
        href={`/coach/athletes/${athlete.id}`}
        className={cn(
          "flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs transition hover:bg-sidebar-accent",
          active && "bg-sidebar-accent",
        )}
      >
        <div className="relative">
          <Avatar className="h-7 w-7">
            <AvatarImage src={athlete.avatar_url ?? undefined} />
            <AvatarFallback className="bg-primary/20 text-primary text-[10px]">{initials}</AvatarFallback>
          </Avatar>
          {injured && (
            <span className="absolute -right-0.5 -top-0.5 grid h-3 w-3 place-items-center rounded-full bg-destructive">
              <AlertTriangle className="h-2 w-2 text-white" />
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate font-medium">{athlete.full_name || "Unnamed"}</div>
          <div className="mt-1 flex items-center gap-1.5">
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
              <div className={cn("h-full", tone)} style={{ width: `${adherence}%` }} />
            </div>
            <span className="text-[10px] text-muted-foreground">{adherence}%</span>
          </div>
        </div>
      </Link>
    </li>
  );
}
