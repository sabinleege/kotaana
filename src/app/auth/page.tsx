"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { PortalNotice } from "@/components/PortalNotice";
import { toast } from "sonner";
import { Dumbbell, Loader2 } from "lucide-react";

type Mode = "signin" | "signup";

export default function AuthPage() {
  return (
    <Suspense fallback={null}>
      <AuthInner />
    </Suspense>
  );
}

const AUTH_ERRORS: Record<string, string> = {
  Configuration: "Sign-in isn't configured correctly on the server. Check the Google credentials.",
  AccessDenied: "Access denied — you cancelled, or this Google account isn't allowed (add it as a test user).",
  OAuthAccountNotLinked: "That email is already registered with a password. Sign in with your password instead.",
  OAuthCallback: "Google sign-in failed on the way back. Check the redirect URI matches exactly.",
  Verification: "That sign-in link has expired. Please try again.",
};

function AuthInner() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl");
  const authError = params.get("error");

  // Surface Auth.js errors (e.g. Google OAuth failures) instead of a broken page.
  useEffect(() => {
    if (authError) {
      toast.error(AUTH_ERRORS[authError] ?? `Sign-in failed (${authError})`);
    }
  }, [authError]);

  const [mode, setMode] = useState<Mode>("signin");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"user" | "coach">("user");

  async function completeSignIn() {
    const res = await signIn("credentials", { email, password, redirect: false });
    if (res?.error) {
      toast.error("Invalid email or password");
      return false;
    }
    // Resolve where to land: explicit callback, else role-based.
    const me = await fetch("/api/me").then((r) => r.json()).catch(() => null);
    const dest = callbackUrl || (me?.role === "coach" ? "/coach" : "/app");
    router.push(dest);
    router.refresh();
    return true;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, fullName, role }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          toast.error(data.error || "Could not create account");
          return;
        }
        toast.success("Account created");
      }
      await completeSignIn();
    } finally {
      setLoading(false);
    }
  }

  async function handleDemo() {
    setLoading(true);
    setEmail("demo.coach@kotaana.demo");
    setPassword("DemoCoach!2026");
    try {
      const res = await signIn("credentials", {
        email: "demo.coach@kotaana.demo",
        password: "DemoCoach!2026",
        redirect: false,
      });
      if (res?.error) {
        toast.error("Demo login failed — run `bun run db:seed`");
        return;
      }
      router.push("/coach");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-[var(--glow-primary)]">
            <Dumbbell className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-semibold">Kotaana</h1>
          <p className="text-sm text-muted-foreground">
            Track your fitness. Let your coach follow up.
          </p>
        </div>

        <button
          onClick={handleDemo}
          disabled={loading}
          className="mb-4 w-full rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium hover:bg-accent/10 disabled:opacity-50"
        >
          Try the coach demo (one click)
        </button>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-xl">
          <button
            type="button"
            onClick={() => signIn("google", { callbackUrl: callbackUrl || "/app" })}
            className="mb-5 flex w-full items-center justify-center gap-2.5 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-medium transition hover:bg-accent/10"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.26 1.06-3.71 1.06-2.85 0-5.27-1.93-6.13-4.52H2.18v2.84A11 11 0 0 0 12 23Z" />
              <path fill="#FBBC05" d="M5.87 14.11a6.6 6.6 0 0 1 0-4.22V7.05H2.18a11 11 0 0 0 0 9.9l3.69-2.84Z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.05l3.69 2.84C6.73 7.31 9.15 5.38 12 5.38Z" />
            </svg>
            Continue with Google
          </button>
          <div className="mb-5 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
          </div>
          <div className="mb-6 grid grid-cols-2 gap-1 rounded-xl bg-muted p-1 text-sm">
            {(["signin", "signup"] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`rounded-lg py-2 font-medium transition-colors ${
                  mode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                }`}
              >
                {m === "signin" ? "Sign in" : "Create account"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="grid gap-4">
            {mode === "signup" && (
              <div className="grid gap-2">
                <label className="text-sm" htmlFor="fullName">Full name</label>
                <input
                  id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} required
                  className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            )}
            <div className="grid gap-2">
              <label className="text-sm" htmlFor="email">Email</label>
              <input
                id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm" htmlFor="password">Password</label>
              <input
                id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                required minLength={mode === "signup" ? 6 : undefined}
                className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            {mode === "signup" && (
              <div className="grid gap-2">
                <label className="text-sm">I am a…</label>
                <div className="grid grid-cols-2 gap-2">
                  {(["user", "coach"] as const).map((r) => (
                    <button
                      type="button" key={r} onClick={() => setRole(r)}
                      className={`rounded-lg border px-3 py-2 text-sm ${
                        role === r ? "border-primary bg-primary/10 text-primary" : "border-border"
                      }`}
                    >
                      {r === "user" ? "Athlete" : "Coach"}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <button
              type="submit" disabled={loading}
              className="mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
