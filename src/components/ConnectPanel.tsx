"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  useConnections, useMyConnectCode, useSendConnectionRequest,
  useRespondToConnection, useDisconnect, type Connection,
} from "@/hooks/use-connections";
import { Link2, Copy, Check, X, Clock, UserPlus, Loader2 } from "lucide-react";

export function ConnectPanel({ variant }: { variant: "coach" | "athlete" }) {
  const { data, isLoading } = useConnections();
  const { data: codeData } = useMyConnectCode();
  const send = useSendConnectionRequest();
  const respond = useRespondToConnection();
  const disconnect = useDisconnect();
  const [value, setValue] = useState("");
  const [copied, setCopied] = useState(false);

  const otherWord = variant === "coach" ? "athlete" : "coach";
  const activeWord = variant === "coach" ? "athletes" : "coaches";

  function submit() {
    const v = value.trim();
    if (!v) return;
    const input = v.includes("@") ? { email: v } : { code: v };
    send.mutate(input, { onSuccess: () => setValue("") });
  }

  function copyCode() {
    if (!codeData?.code) return;
    navigator.clipboard.writeText(codeData.code);
    setCopied(true);
    toast.success("Connect code copied");
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="flex items-center gap-2">
        <Link2 className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">Connect with {variant === "coach" ? "an athlete" : "a coach"}</h2>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Send a request by email or connect code. Your {otherWord} confirms it, then follow-up begins.
      </p>

      {/* Send a request */}
      <div className="mt-4 flex gap-2">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder={`${otherWord[0].toUpperCase() + otherWord.slice(1)}'s email or connect code`}
          className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          onClick={submit}
          disabled={!value.trim() || send.isPending}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          {send.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
          Send request
        </button>
      </div>

      {/* My connect code */}
      <div className="mt-3 flex items-center gap-2 rounded-lg border border-dashed border-border bg-muted/30 px-3 py-2">
        <span className="text-xs text-muted-foreground">Your connect code:</span>
        <code className="font-mono text-sm font-semibold tracking-wider">{codeData?.code ?? "…"}</code>
        <button onClick={copyCode} className="ml-auto text-muted-foreground hover:text-foreground" aria-label="Copy code">
          {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
        </button>
      </div>

      {isLoading ? (
        <div className="mt-6 h-16 animate-pulse rounded-xl bg-muted/40" />
      ) : (
        <>
          {/* Incoming — awaiting MY approval */}
          {!!data?.incoming.length && (
            <Section title="Requests to confirm">
              {data.incoming.map((c) => (
                <Row key={c.id} c={c} sub="wants to connect">
                  <button
                    onClick={() => respond.mutate({ id: c.id, action: "approve" })}
                    className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90"
                  >
                    <Check className="h-3.5 w-3.5" /> Confirm
                  </button>
                  <button
                    onClick={() => respond.mutate({ id: c.id, action: "decline" })}
                    className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-accent/10"
                  >
                    <X className="h-3.5 w-3.5" /> Decline
                  </button>
                </Row>
              ))}
            </Section>
          )}

          {/* Outgoing — awaiting THEIR approval */}
          {!!data?.outgoing.length && (
            <Section title="Awaiting confirmation">
              {data.outgoing.map((c) => (
                <Row key={c.id} c={c} sub="pending" icon={<Clock className="h-3.5 w-3.5 text-muted-foreground" />}>
                  <button
                    onClick={() => disconnect.mutate(c.id)}
                    className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-accent/10"
                  >
                    <X className="h-3.5 w-3.5" /> Cancel
                  </button>
                </Row>
              ))}
            </Section>
          )}

          {/* Active */}
          <Section title={`Connected ${activeWord}`}>
            {data?.active.length ? (
              data.active.map((c) => (
                <Row key={c.id} c={c} sub={c.other.email ?? ""}>
                  <button
                    onClick={() => disconnect.mutate(c.id)}
                    className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  >
                    Disconnect
                  </button>
                </Row>
              ))
            ) : (
              <div className="px-1 py-3 text-sm text-muted-foreground">No {activeWord} connected yet.</div>
            )}
          </Section>
        </>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-6">
      <div className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">{title}</div>
      <div className="divide-y divide-border rounded-xl border border-border">{children}</div>
    </div>
  );
}

function Row({ c, sub, icon, children }: { c: Connection; sub: string; icon?: React.ReactNode; children: React.ReactNode }) {
  const initials = (c.other.full_name || c.other.email || "?").split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div className="flex items-center gap-3 p-3">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/20 text-xs font-semibold text-primary">
        {initials}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">{c.other.full_name || c.other.email}</div>
        <div className="flex items-center gap-1 truncate text-xs text-muted-foreground">{icon}{sub}</div>
      </div>
      <div className="flex shrink-0 gap-2">{children}</div>
    </div>
  );
}
