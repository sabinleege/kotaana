"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { apiPost } from "@/lib/fetcher";
import { Dumbbell, Loader2, UserCheck } from "lucide-react";

function JoinInner() {
  const params = useSearchParams();
  const router = useRouter();
  const { status } = useSession();
  const [code, setCode] = useState(params.get("code") ?? "");
  const [loading, setLoading] = useState(false);

  async function accept() {
    if (!code.trim()) return;
    setLoading(true);
    try {
      await apiPost("/api/invites/accept", { code: code.trim() });
      toast.success("You're connected to your coach!");
      router.push("/app");
      router.refresh();
    } catch (e: any) {
      toast.error(e.message || "Could not accept invite");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-background px-4">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-[var(--glow-primary)]">
          <Dumbbell className="h-6 w-6" />
        </div>
        <h1 className="mt-4 text-2xl font-semibold">Connect with your coach</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Enter the invite code your coach shared. They&apos;ll be able to follow up on your progress.
        </p>

        {status === "unauthenticated" ? (
          <div className="mt-6 rounded-2xl border border-border bg-card p-6">
            <p className="text-sm text-muted-foreground">Sign in or create an athlete account first.</p>
            <Link
              href={`/auth?callbackUrl=/join${code ? `?code=${code}` : ""}`}
              className="mt-4 inline-flex rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              Sign in to continue
            </Link>
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-border bg-card p-6">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Invite code"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-center font-mono text-sm outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              onClick={accept}
              disabled={loading || !code.trim() || status === "loading"}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserCheck className="h-4 w-4" />}
              Accept invite
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function JoinPage() {
  return (
    <Suspense fallback={null}>
      <JoinInner />
    </Suspense>
  );
}
