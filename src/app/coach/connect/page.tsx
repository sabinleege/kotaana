"use client";

import { ConnectPanel } from "@/components/ConnectPanel";
import { Link2 } from "lucide-react";

export default function CoachConnectPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
          <Link2 className="h-5 w-5" />
        </span>
        <div>
          <div className="text-sm text-muted-foreground">Roster</div>
          <h1 className="text-3xl font-semibold">Connect</h1>
        </div>
      </div>
      <ConnectPanel variant="coach" />
    </div>
  );
}
