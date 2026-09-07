// Fitness metric helpers shared across the athlete app.

export type BmiResult = {
  value: number; // rounded to 1 decimal
  category: "Underweight" | "Normal" | "Overweight" | "Obese";
  // 0..1 position of the value across the 15–35 BMI scale (for gauges)
  scale: number;
  tone: "accent" | "primary" | "chart-2" | "destructive";
};

/** Body Mass Index from weight (kg) and height (cm). */
export function bmi(weightKg?: number | null, heightCm?: number | null): BmiResult | null {
  if (!weightKg || !heightCm) return null;
  const m = heightCm / 100;
  const value = weightKg / (m * m);
  const rounded = Math.round(value * 10) / 10;
  let category: BmiResult["category"];
  let tone: BmiResult["tone"];
  if (value < 18.5) { category = "Underweight"; tone = "accent"; }
  else if (value < 25) { category = "Normal"; tone = "primary"; }
  else if (value < 30) { category = "Overweight"; tone = "chart-2"; }
  else { category = "Obese"; tone = "destructive"; }
  const scale = Math.max(0, Math.min(1, (value - 15) / (35 - 15)));
  return { value: rounded, category, scale, tone };
}

/** Mifflin-St Jeor basal metabolic rate (kcal/day). */
export function bmr(opts: {
  weightKg?: number | null;
  heightCm?: number | null;
  age?: number | null;
  gender?: string | null;
}): number | null {
  const { weightKg, heightCm, age } = opts;
  if (!weightKg || !heightCm || !age) return null;
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  const male = (opts.gender ?? "").toLowerCase().startsWith("m");
  return Math.round(base + (male ? 5 : -161));
}

const ACTIVITY_FACTOR: Record<string, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
  athlete: 1.9,
};

/** Total daily energy expenditure (kcal) = BMR × activity factor. */
export function tdee(opts: Parameters<typeof bmr>[0] & { activityLevel?: string | null }): number | null {
  const base = bmr(opts);
  if (!base) return null;
  const factor = ACTIVITY_FACTOR[(opts.activityLevel ?? "moderate").toLowerCase()] ?? 1.55;
  return Math.round(base * factor);
}

/** Progress toward a goal weight given a starting weight. Returns 0..1 (clamped). */
export function goalProgress(start?: number | null, current?: number | null, target?: number | null): number | null {
  if (start == null || current == null || target == null) return null;
  const total = start - target;
  if (Math.abs(total) < 0.01) return 1;
  const done = start - current;
  return Math.max(0, Math.min(1, done / total));
}

export type BodyComposition = {
  fatPercent: number; // %
  fatMassKg: number;
  leanMassKg: number;
  estimated: boolean; // true when derived from BMI (no measured value)
  category: "Essential" | "Athlete" | "Fitness" | "Average" | "High";
};

/**
 * Body-fat %. Uses a measured value when provided, otherwise estimates it
 * from BMI/age/gender (Deurenberg). Also returns fat/lean mass.
 */
export function bodyComposition(opts: {
  weightKg?: number | null;
  heightCm?: number | null;
  age?: number | null;
  gender?: string | null;
  measuredPercent?: number | null;
}): BodyComposition | null {
  const { weightKg, heightCm, age } = opts;
  if (!weightKg || !heightCm) return null;

  const male = (opts.gender ?? "").toLowerCase().startsWith("m");
  let pct = opts.measuredPercent ?? null;
  let estimated = false;
  if (pct == null || pct <= 0) {
    if (!age) return null;
    const m = heightCm / 100;
    const bmiVal = weightKg / (m * m);
    pct = 1.2 * bmiVal + 0.23 * age - 10.8 * (male ? 1 : 0) - 5.4; // Deurenberg
    estimated = true;
  }
  pct = Math.max(3, Math.min(60, pct));
  const fatMassKg = Math.round((weightKg * pct) / 100 * 10) / 10;
  const leanMassKg = Math.round((weightKg - fatMassKg) * 10) / 10;

  // Category thresholds differ by sex (ACE).
  const t = male ? [6, 14, 18, 25] : [14, 21, 25, 32];
  let category: BodyComposition["category"];
  if (pct < t[0]) category = "Essential";
  else if (pct < t[1]) category = "Athlete";
  else if (pct < t[2]) category = "Fitness";
  else if (pct < t[3]) category = "Average";
  else category = "High";

  return { fatPercent: Math.round(pct * 10) / 10, fatMassKg, leanMassKg, estimated, category };
}

/** Recommended macro split (g) from a calorie target. Balanced 30P/40C/30F. */
export function macroTargets(calories: number) {
  return {
    protein: Math.round((calories * 0.3) / 4),
    carbs: Math.round((calories * 0.4) / 4),
    fat: Math.round((calories * 0.3) / 9),
  };
}
