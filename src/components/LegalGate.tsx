"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { apiPost } from "@/lib/fetcher";
import { ShieldCheck, Loader2 } from "lucide-react";

/** Blocking acceptance screen shown until the user accepts Terms + Medical Disclaimer. */
export function LegalGate() {
  const router = useRouter();
  const [tos, setTos] = useState(false);
  const [medical, setMedical] = useState(false);
  const [data, setData] = useState(true);
  const [loading, setLoading] = useState(false);

  async function accept() {
    if (!tos || !medical) return;
    setLoading(true);
    try {
      await apiPost("/api/legal/accept", { tos, medical, data });
      toast.success("Thanks — you're all set.");
      router.refresh();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-background px-4">
      <div className="w-full max-w-lg rounded-3xl border border-border bg-card p-7 shadow-2xl">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <h1 className="mt-4 text-2xl font-bold">Before you start</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Kotaana gives AI-generated fitness guidance — not medical advice. Please read and accept the following.
        </p>

        <div className="mt-6 space-y-3">
          <Check checked={tos} onChange={setTos}>
            I agree to the <span className="text-primary">Terms &amp; Conditions</span> and Privacy Policy.
          </Check>
          <Check checked={medical} onChange={setMedical}>
            <b>Medical Disclaimer.</b> I understand Kotaana is not a substitute for professional medical advice.
            I'll consult a doctor before starting a program, especially if pregnant, injured, or managing a condition,
            and stop and seek help if I feel unwell.
          </Check>
          <Check checked={data} onChange={setData}>
            I consent to my fitness &amp; health data being processed to personalize my plans (you can withdraw anytime).
          </Check>
        </div>

        <button
          onClick={accept}
          disabled={!tos || !medical || loading}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[image:var(--gradient-primary)] py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />} Agree &amp; continue
        </button>
      </div>
    </div>
  );
}

function Check({ checked, onChange, children }: { checked: boolean; onChange: (b: boolean) => void; children: React.ReactNode }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border p-3 text-sm hover:bg-accent/5">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[color:var(--color-primary)]" />
      <span className="text-muted-foreground">{children}</span>
    </label>
  );
}
