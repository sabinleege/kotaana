"use client";

/**
 * Separate coach login / signup entry (not the athlete /auth page).
 * Hooks to Auth.js credentials + register-coach API.
 */
import { useState } from "react";
import { signIn } from "next-auth/react";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import { portalLoginUrl } from "@/lib/portal";
import { PortalNotice } from "@/components/PortalNotice";
import { useRouter } from "next/navigation";

export default function CoachAuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "signup") {
        const res = await fetch("/api/auth/register-coach", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, name }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Signup failed");
      }

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (result?.error) throw new Error("Invalid credentials");
      router.push("/coach");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h1 className="text-2xl font-semibold">Coach portal</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Separate login for coaches monitoring athletes. Athletes use the main app login.
        </p>

        <PortalNotice portalLabel="Coach" />

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`rounded-full px-3 py-1 text-xs ${
              mode === "login" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => setMode("signup")}
            className={`rounded-full px-3 py-1 text-xs ${
              mode === "signup" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}
          >
            Create coach account
          </button>
        </div>

        <div className="mt-6">
          <GoogleSignInButton callbackUrl="/coach" intendedRole="coach" />
          <div className="mt-5 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
          </div>
        </div>

        <form onSubmit={onSubmit} className="mt-6 space-y-3">
          {mode === "signup" && (
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              required
            />
          )}
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            required
            minLength={6}
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            {loading ? "Please wait…" : mode === "login" ? "Sign in as coach" : "Create coach account"}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Athlete?{" "}
          <a href={portalLoginUrl("athlete")} className="text-primary">
            Go to athlete login
          </a>
        </p>
      </div>
    </div>
  );
}
