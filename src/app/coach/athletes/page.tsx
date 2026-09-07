"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Search, Mail } from "lucide-react";
import { useMyAthletes } from "@/hooks/use-coach-data";
import { AthleteCard } from "@/components/coach/AthleteCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { apiPost } from "@/lib/fetcher";

export default function AthletesPage() {
  const { data: athletes = [], isLoading } = useMyAthletes();
  const [q, setQ] = useState("");
  const filtered = athletes.filter(
    (a) =>
      (a.full_name || "").toLowerCase().includes(q.toLowerCase()) ||
      (a.email || "").toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div className="mx-auto max-w-7xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-sm text-muted-foreground">Roster</div>
          <h1 className="text-3xl font-semibold">Athletes ({athletes.length})</h1>
        </div>
        <InviteDialog />
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="relative min-w-64 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search by name or email" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
        </div>
      </div>

      {isLoading ? (
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => <div key={i} className="h-44 animate-pulse rounded-2xl border border-border bg-card" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-border bg-card p-12 text-center text-muted-foreground">
          No athletes match your search.
        </div>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((a) => <AthleteCard key={a.id} athlete={a} />)}
        </div>
      )}
    </div>
  );
}

function InviteDialog() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    try {
      const v = email.trim();
      await apiPost("/api/connections/request", v.includes("@") ? { email: v } : { code: v });
      toast.success("Request sent — the athlete confirms to connect");
      setEmail("");
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["connections"] });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="mr-2 h-4 w-4" /> Add athlete</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Connect with an athlete</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <Label htmlFor="invite-email">Athlete&apos;s email or connect code</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="invite-email" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-9" placeholder="athlete@email.com or CODE" />
          </div>
          <p className="text-xs text-muted-foreground">
            We&apos;ll send a request. The athlete confirms it from their settings, then they join your roster.
            Manage all requests on the <span className="text-primary">Connect</span> page.
          </p>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit} disabled={loading || !email}>Send request</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
