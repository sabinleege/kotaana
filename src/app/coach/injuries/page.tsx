"use client";

import { InjuryTable } from "@/components/coach/InjuryTable";
import { ShieldAlert } from "lucide-react";

export default function InjuriesPage() {
  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6 flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-destructive/10 text-destructive">
          <ShieldAlert className="h-5 w-5" />
        </span>
        <div>
          <div className="text-sm text-muted-foreground">Health</div>
          <h1 className="text-3xl font-semibold">Injuries &amp; Recovery</h1>
        </div>
      </div>
      <InjuryTable />
    </div>
  );
}
