"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Copy, Mail, Plus, X } from "lucide-react";
import { useMyInvites, useCreateInvite, useRevokeInvite } from "@/hooks/use-coach-invites";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";

export default function InvitesPage() {
  const { data: invites = [], isLoading } = useMyInvites();
  const revoke = useRevokeInvite();

  function copyLink(code: string) {
    const url = `${window.location.origin}/join?code=${code}`;
    navigator.clipboard.writeText(url);
    toast.success("Invite link copied");
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-sm text-muted-foreground">Athlete onboarding</div>
          <h1 className="text-3xl font-semibold">Invites</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Generate a code or link. Share it with an athlete and they&apos;ll be linked to your roster on acceptance.
          </p>
        </div>
        <CreateInviteDialog />
      </div>

      {isLoading ? (
        <div className="mt-6 h-32 animate-pulse rounded-2xl bg-card" />
      ) : invites.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-border bg-card p-12 text-center text-muted-foreground">
          No invites yet.
        </div>
      ) : (
        <div className="mt-6 grid gap-3">
          {invites.map((inv) => (
            <Card key={inv.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <div className="flex items-center gap-2">
                  <code className="rounded bg-muted px-2 py-1 font-mono text-sm">{inv.invite_code}</code>
                  <Badge variant={inv.status === "accepted" ? "default" : inv.status === "pending" ? "secondary" : "outline"}>
                    {inv.status}
                  </Badge>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {inv.email ? <><Mail className="mr-1 inline h-3 w-3" />{inv.email} · </> : null}
                  Created {format(new Date(inv.created_at), "MMM d")} · Expires {format(new Date(inv.expires_at), "MMM d")}
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => copyLink(inv.invite_code)}>
                  <Copy className="mr-1 h-3 w-3" /> Copy link
                </Button>
                {inv.status === "pending" && (
                  <Button size="sm" variant="ghost" onClick={() => revoke.mutate(inv.id)}>
                    <X className="mr-1 h-3 w-3" /> Revoke
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function CreateInviteDialog() {
  const create = useCreateInvite();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");

  async function submit() {
    await create.mutateAsync(email.trim() || null);
    setEmail("");
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="mr-2 h-4 w-4" /> New invite</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Generate invite</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <Label>Athlete email (optional)</Label>
          <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="athlete@email.com" />
          <p className="text-xs text-muted-foreground">
            Leave blank for an open code that any athlete can redeem. Otherwise only this email can accept.
          </p>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit} disabled={create.isPending}>Generate</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
