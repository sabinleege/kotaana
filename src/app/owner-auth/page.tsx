"use client";

/**
 * Separate OWNER login — metrics control only (role=admin).
 * Not the athlete /auth or coach /coach-auth portals.
 */
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function OwnerAuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "bootstrap">("login");
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
      if (mode === "bootstrap") {
        const res = await fetch("/api/auth/register-owner", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, name }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Could not create owner");
      }

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (result?.error) throw new Error("Invalid credentials or not an owner account");
      router.push("/admin");
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
        <h1 className="text-2xl font-semibold">App owner</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Metrics &amp; control only. Athletes use Athlete login; coaches use Coach login.
        </p>

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
            onClick={() => setMode("bootstrap")}
            className={`rounded-full px-3 py-1 text-xs ${
              mode === "bootstrap" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}
          >
            First-time owner setup
          </button>
        </div>

        <form onSubmit={onSubmit} className="mt-6 space-y-3">
          {mode === "bootstrap" && (
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Owner name"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              required
            />
          )}
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Owner email"
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password (min 8)"
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            required
            minLength={8}
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            {loading ? "Please wait…" : mode === "login" ? "Sign in as owner" : "Create owner & sign in"}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          <Link href="/auth" className="text-primary">Athlete</Link>
          {" · "}
          <Link href="/coach-auth" className="text-primary">Coach</Link>
          {" · "}
          <Link href="/" className="text-primary">Home</Link>
        </p>
        {mode === "bootstrap" && (
          <p className="mt-2 text-center text-[11px] text-muted-foreground">
            Bootstrap works only when no owner exists yet.
          </p>
        )}
      </div>
    </div>
  );
}
