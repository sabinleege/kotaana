"use client";

import { useEffect, useRef, useState } from "react";
import { apiPost } from "@/lib/fetcher";
import { MessageCircle, X, Send, Loader2, Sparkles } from "lucide-react";

type Msg = { role: "user" | "assistant"; content: string };

export function AICoachChat() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([
    { role: "assistant", content: "Hey! I'm your AI coach. Ask me about your plan, form, nutrition, or how to train around an injury." },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, open]);

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    const next = [...msgs, { role: "user" as const, content: text }];
    setMsgs(next);
    setInput("");
    setBusy(true);
    try {
      const { reply } = await apiPost<{ reply: string }>("/api/ai/chat", {
        message: text,
        history: next.slice(-8),
      });
      setMsgs((m) => [...m, { role: "assistant", content: reply }]);
    } catch (e: any) {
      setMsgs((m) => [...m, { role: "assistant", content: `⚠️ ${e.message || "Something went wrong."}` }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="AI coach chat"
          className="fixed bottom-5 right-5 z-40 grid h-14 w-14 place-items-center rounded-full bg-[image:var(--gradient-primary)] text-primary-foreground shadow-[var(--glow-primary)] transition hover:scale-105"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-end p-0 sm:bottom-5 sm:right-5 sm:inset-auto">
          <div className="flex h-[80vh] w-full flex-col overflow-hidden border border-border bg-card shadow-2xl sm:h-[560px] sm:w-[380px] sm:rounded-3xl">
            <header className="flex items-center gap-2 border-b border-border/60 bg-[image:var(--gradient-primary)] px-4 py-3 text-primary-foreground">
              <Sparkles className="h-4 w-4" />
              <span className="text-sm font-semibold">AI Coach</span>
              <button onClick={() => setOpen(false)} className="ml-auto grid h-8 w-8 place-items-center rounded-lg hover:bg-white/15" aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </header>

            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {msgs.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-sm ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>
                    {m.content}
                  </div>
                </div>
              ))}
              {busy && (
                <div className="flex justify-start">
                  <div className="rounded-2xl bg-muted px-3.5 py-2.5 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /></div>
                </div>
              )}
              <div ref={endRef} />
            </div>

            <div className="border-t border-border/60 p-3">
              <div className="flex items-center gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && send()}
                  placeholder="Ask your coach…"
                  className="flex-1 rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
                <button onClick={send} disabled={busy || !input.trim()} className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50">
                  <Send className="h-4 w-4" />
                </button>
              </div>
              <p className="mt-1.5 text-center text-[10px] text-muted-foreground">AI guidance, not medical advice.</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
