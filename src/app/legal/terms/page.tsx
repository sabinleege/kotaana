import Link from "next/link";

export const metadata = { title: "Terms of Service — Kotaana" };

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-12 text-sm leading-relaxed text-foreground">
      <nav className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        <Link href="/">Home</Link>
        <Link href="/legal/terms" className="text-primary">Terms</Link>
        <Link href="/legal/privacy">Privacy</Link>
        <Link href="/legal/medical">Medical</Link>
      </nav>
      <h1 className="text-3xl font-semibold">Terms of Service</h1>
      <p className="text-muted-foreground">Last updated: August 2026</p>
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">1. Service</h2>
        <p>
          Kotaana (Kotaana) provides fitness coaching tools, AI-generated training and nutrition
          suggestions, and coach–athlete coordination features. By creating an account you agree to these terms.
        </p>
        <h2 className="text-lg font-semibold">2. Accounts</h2>
        <p>
          You must provide accurate information and keep credentials secure. Athlete, coach, and owner accounts
          have different permissions; misuse may result in suspension.
        </p>
        <h2 className="text-lg font-semibold">3. AI content</h2>
        <p>
          Workouts, meals, and advice are generated or assisted by AI and may be incomplete or incorrect.
          They are not a substitute for professional medical or coaching judgment.
        </p>
        <h2 className="text-lg font-semibold">4. Payments</h2>
        <p>
          Paid plans (when enabled) renew according to the plan you select. Fees are non-refundable except where
          required by law.
        </p>
        <h2 className="text-lg font-semibold">5. Acceptable use</h2>
        <p>
          Do not abuse the API, scrape the service, upload unlawful content, or attempt to access other users’ data.
        </p>
        <h2 className="text-lg font-semibold">6. Contact</h2>
        <p>Questions about these terms: use the support channel associated with your account email.</p>
      </section>
    </div>
  );
}
