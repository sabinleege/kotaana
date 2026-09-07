import Link from "next/link";

export const metadata = { title: "Medical disclaimer — Kotaana" };

export default function MedicalPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-12 text-sm leading-relaxed text-foreground">
      <nav className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        <Link href="/">Home</Link>
        <Link href="/legal/terms">Terms</Link>
        <Link href="/legal/privacy">Privacy</Link>
        <Link href="/legal/medical" className="text-primary">Medical</Link>
      </nav>
      <h1 className="text-3xl font-semibold">Medical disclaimer</h1>
      <p className="text-muted-foreground">Important — please read</p>
      <section className="space-y-3">
        <p>
          Kotaana is a <strong>fitness and coaching software tool</strong>, not a medical device and not a
          licensed healthcare provider. Content—including AI workouts, nutrition tips, injury timelines, risk scores,
          and document summaries—is for general informational and coaching support only.
        </p>
        <p>
          It does <strong>not</strong> diagnose, treat, cure, or prevent any disease. Always consult a qualified
          physician or clinician before starting or changing exercise or diet, especially if you are pregnant, injured,
          or have a medical condition.
        </p>
        <p>
          Stop activity and seek emergency care for chest pain, severe shortness of breath, dizziness, uncontrolled
          bleeding, or other urgent symptoms.
        </p>
        <p>
          By using the app you acknowledge this disclaimer (also collected during onboarding where applicable).
        </p>
      </section>
    </div>
  );
}
