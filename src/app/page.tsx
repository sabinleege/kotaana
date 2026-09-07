import Link from "next/link";
import { Dumbbell, Users, BarChart3, ShieldCheck, ArrowRight, Activity, Gauge } from "lucide-react";

/** Landing — exactly three logins: Athlete, Coach, Owner. No demo accounts. */
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/50">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-primary text-primary-foreground">
              <Dumbbell className="h-4 w-4" />
            </div>
            <span className="text-lg font-semibold">Kotaana</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/auth" className="rounded-full border border-border px-3 py-1.5 text-sm hover:bg-accent/10">
              Athlete
            </Link>
            <Link href="/coach-auth" className="rounded-full border border-border px-3 py-1.5 text-sm hover:bg-accent/10">
              Coach
            </Link>
            <Link href="/owner-auth" className="rounded-full bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground">
              Owner
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-16">
        <section className="grid gap-4">
          <span className="inline-flex w-fit rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs uppercase tracking-widest text-primary">
            3 portals · no shared login
          </span>
          <h1 className="max-w-3xl text-4xl font-bold leading-tight md:text-5xl">
            Athletes train. Coaches monitor.{" "}
            <span className="bg-[image:var(--gradient-primary)] bg-clip-text text-transparent">
              Owners see the metrics.
            </span>
          </h1>
          <p className="max-w-2xl text-muted-foreground">
            Each role has its own sign-in and dashboard. No demo accounts — register or create the first owner.
          </p>
        </section>

        <section className="mt-12 grid gap-5 md:grid-cols-3">
          <Link href="/auth" className="group rounded-3xl border border-border bg-card p-6 transition hover:border-primary/40">
            <Activity className="h-7 w-7 text-primary" />
            <h2 className="mt-4 text-xl font-semibold">Athlete</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Workouts, health, nutrition, progress, notifications.
            </p>
            <p className="mt-4 text-sm font-medium text-primary group-hover:underline">
              /auth → /app <ArrowRight className="inline h-4 w-4" />
            </p>
          </Link>

          <Link href="/coach-auth" className="group rounded-3xl border border-border bg-card p-6 transition hover:border-primary/40">
            <Users className="h-7 w-7 text-primary" />
            <h2 className="mt-4 text-xl font-semibold">Coach</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Manage athletes, statistics, recommendations, follow-ups.
            </p>
            <p className="mt-4 text-sm font-medium text-primary group-hover:underline">
              /coach-auth → /coach <ArrowRight className="inline h-4 w-4" />
            </p>
          </Link>

          <Link href="/owner-auth" className="group rounded-3xl border border-border bg-card p-6 transition hover:border-primary/40">
            <Gauge className="h-7 w-7 text-primary" />
            <h2 className="mt-4 text-xl font-semibold">App owner</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Platform metrics only — users, AI usage, links, subscriptions.
            </p>
            <p className="mt-4 text-sm font-medium text-primary group-hover:underline">
              /owner-auth → /admin <ArrowRight className="inline h-4 w-4" />
            </p>
          </Link>
        </section>

        <section className="mt-16 grid gap-4 md:grid-cols-2">
          {[
            { icon: ShieldCheck, t: "Isolated dashboards", b: "Middleware blocks cross-portal access by role." },
            { icon: BarChart3, t: "Owner metrics", b: "Counts of athletes, coaches, AI calls, injuries, activity." },
          ].map(({ icon: Icon, t, b }) => (
            <div key={t} className="rounded-2xl border border-border bg-card p-5">
              <Icon className="h-5 w-5 text-primary" />
              <h3 className="mt-3 font-semibold">{t}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{b}</p>
            </div>
          ))}
        </section>

        <footer className="mt-16 border-t border-border py-6 text-center text-xs text-muted-foreground">
          <a href="/legal/terms" className="hover:text-foreground">Terms</a>
          {" · "}
          <a href="/legal/privacy" className="hover:text-foreground">Privacy</a>
          {" · "}
          <a href="/legal/medical" className="hover:text-foreground">Medical disclaimer</a>
        </footer>
      </main>
    </div>
  );
}
