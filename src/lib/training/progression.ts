/**
 * Bit-by-bit progression from last effort logs.
 */
export type Effort = "easy" | "ok" | "hard";

export function suggestNextReps(
  currentReps: string | undefined,
  effort: Effort | null | undefined,
  level: string,
): string {
  const base = currentReps || "8-12";
  if (!effort || effort === "ok") return base;
  const m = base.match(/(\d+)\s*[-–]\s*(\d+)/);
  if (effort === "easy") {
    if (m) {
      const lo = Number(m[1]);
      const hi = Number(m[2]);
      return `${lo + 1}-${hi + 1}`;
    }
    return base + " (+1 if form holds)";
  }
  // hard
  if (m) {
    const lo = Math.max(4, Number(m[1]) - 1);
    const hi = Math.max(lo, Number(m[2]) - 1);
    return `${lo}-${hi}`;
  }
  if (level === "beginner") return "reduce range — focus form";
  return base;
}

export function suggestLoadNote(effort: Effort | null | undefined, ageBand: string): string | undefined {
  if (ageBand.startsWith("youth")) {
    if (effort === "easy") return "Next time: +1–2 quality reps or slower tempo — avoid heavy loading.";
    if (effort === "hard") return "Keep the same difficulty; prioritize form and fun.";
    return undefined;
  }
  if (effort === "easy") return "Progression: add 1–2 reps or a small load increase next session.";
  if (effort === "hard") return "Hold load; recover form before adding weight.";
  return undefined;
}
