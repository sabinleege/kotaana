/**
 * Pregnancy workflow — trimester + hard safety rules for AI.
 */
export type PregnancyContext = {
  isPregnant: boolean;
  dueDate?: string | null;
  trimester: 1 | 2 | 3 | null;
  weeksApprox: number | null;
  rules: string[];
};

export function getPregnancyContext(opts: {
  isPregnant?: boolean | null;
  pregnancyDueDate?: Date | string | null;
}): PregnancyContext {
  if (!opts.isPregnant) {
    return { isPregnant: false, trimester: null, weeksApprox: null, rules: [] };
  }
  let weeksApprox: number | null = null;
  let trimester: 1 | 2 | 3 | null = 2;
  const due = opts.pregnancyDueDate ? new Date(opts.pregnancyDueDate) : null;
  if (due && !Number.isNaN(due.getTime())) {
    const conception = new Date(due);
    conception.setDate(conception.getDate() - 280);
    weeksApprox = Math.max(0, Math.floor((Date.now() - conception.getTime()) / (7 * 86400000)));
    if (weeksApprox < 13) trimester = 1;
    else if (weeksApprox < 27) trimester = 2;
    else trimester = 3;
  }
  const rules = [
    "PRENATAL-SAFE ONLY — no maximal lifts, no breath-hold / Valsalva, no contact sports",
    "Avoid supine exercises after trimester 1 if uncomfortable",
    "Prefer walking, swimming, controlled strength, pelvic floor awareness",
    "Stop for pain, dizziness, bleeding, or reduced fetal movement — seek medical care",
    "Nutrition: adequate protein, hydration, prenatal micronutrients per clinician advice",
  ];
  if (trimester === 3) rules.push("Trimester 3: reduce impact; prioritize mobility and breathing");
  return {
    isPregnant: true,
    dueDate: due ? due.toISOString().slice(0, 10) : null,
    trimester,
    weeksApprox,
    rules,
  };
}

export function pregnancySystemAddon(ctx: PregnancyContext): string {
  if (!ctx.isPregnant) return "";
  return `\nPREGNANCY CONTEXT: trimester ${ctx.trimester ?? "?"}, ~${ctx.weeksApprox ?? "?"} weeks. RULES:\n- ${ctx.rules.join("\n- ")}`;
}
