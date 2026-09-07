"use client";

import { FollowUpQueue } from "@/components/coach/FollowUpQueue";
import { ClipboardList } from "lucide-react";

export default function FollowUpsPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent/10 text-accent">
          <ClipboardList className="h-5 w-5" />
        </span>
        <div>
          <div className="text-sm text-muted-foreground">Coaching</div>
          <h1 className="text-3xl font-semibold">Follow-ups</h1>
        </div>
      </div>
      <FollowUpQueue />
    </div>
  );
}
