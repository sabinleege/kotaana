import Link from "next/link";

export const metadata = { title: "Privacy Policy — Kotaana" };

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-12 text-sm leading-relaxed text-foreground">
      <nav className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        <Link href="/">Home</Link>
        <Link href="/legal/terms">Terms</Link>
        <Link href="/legal/privacy" className="text-primary">Privacy</Link>
        <Link href="/legal/medical">Medical</Link>
      </nav>
      <h1 className="text-3xl font-semibold">Privacy Policy</h1>
      <p className="text-muted-foreground">Last updated: August 2026</p>
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Data we process</h2>
        <p>
          Account data (email, name, role), profile and health-related inputs you provide (weight, injuries,
          pregnancy status, meals, workouts), usage logs, and AI request metadata needed to operate the service.
        </p>
        <h2 className="text-lg font-semibold">Why</h2>
        <p>
          To provide coaching features, personalize AI suggestions, show coaches data you authorize, improve
          reliability, and meet legal obligations.
        </p>
        <h2 className="text-lg font-semibold">Sharing</h2>
        <p>
          Coaches only see athlete data according to your connection and permission settings. Processors may include
          hosting (e.g. Vercel), database, and AI providers (e.g. Google Gemini) under their terms.
        </p>
        <h2 className="text-lg font-semibold">Retention & rights</h2>
        <p>
          You may request access or deletion of your account data subject to legal retention needs. Contact support
          from your registered email.
        </p>
      </section>
    </div>
  );
}
