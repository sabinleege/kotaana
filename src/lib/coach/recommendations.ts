/**
 * Coach Recommendations engine
 * Scans managed athletes and flags issues the coach should follow up on.
 */

export type AthleteSignalInput = {
  athleteId: string;
  name: string;
  email?: string | null;
  readinessAvg?: number | null; // last 3–7 days
  lastFeeling?: string | null; // great | ok | off | sick
  symptoms?: string | null;
  adherencePct?: number | null; // 0–100
  activeInjuries?: number;
  daysSinceLastCheckin?: number | null;
  daysSinceLastWorkout?: number | null;
  daysSinceLastMealLog?: number | null;
  isPregnant?: boolean;
  healthConditionsCount?: number;
};

export type RecommendationItem = {
  athleteId: string;
  name: string;
  priority: "low" | "normal" | "high";
  issues: string[];
  suggestedAction: string;
  tags: string[]; // injury | illness | nutrition | performance | inactive | safety
};

function priorityFrom(issues: string[], tags: string[]): RecommendationItem["priority"] {
  if (tags.includes("injury") || tags.includes("illness") || tags.includes("safety")) return "high";
  if (issues.length >= 2) return "high";
  if (issues.length === 1) return "normal";
  return "low";
}

export function buildRecommendations(athletes: AthleteSignalInput[]): RecommendationItem[] {
  const items: RecommendationItem[] = [];

  for (const a of athletes) {
    const issues: string[] = [];
    const tags: string[] = [];

    if ((a.activeInjuries ?? 0) > 0) {
      issues.push(`Active injuries: ${a.activeInjuries}`);
      tags.push("injury");
    }

    if (a.lastFeeling === "sick" || a.lastFeeling === "off") {
      issues.push(`Recent feeling: ${a.lastFeeling}${a.symptoms ? ` (${a.symptoms})` : ""}`);
      tags.push("illness");
    }

    if (a.readinessAvg != null && a.readinessAvg < 55) {
      issues.push(`Low readiness avg: ${Math.round(a.readinessAvg)}`);
      tags.push("performance");
    }

    if (a.adherencePct != null && a.adherencePct < 50) {
      issues.push(`Low workout adherence: ${Math.round(a.adherencePct)}%`);
      tags.push("performance");
    }

    if (a.daysSinceLastMealLog != null && a.daysSinceLastMealLog >= 3) {
      issues.push(`No meal logs for ${a.daysSinceLastMealLog} days`);
      tags.push("nutrition");
    }

    if (a.daysSinceLastCheckin != null && a.daysSinceLastCheckin >= 5) {
      issues.push(`No check-in for ${a.daysSinceLastCheckin} days`);
      tags.push("inactive");
    }

    if (a.daysSinceLastWorkout != null && a.daysSinceLastWorkout >= 7) {
      issues.push(`No workout for ${a.daysSinceLastWorkout} days`);
      tags.push("inactive");
    }

    if (a.isPregnant) {
      issues.push("Pregnancy flag — use prenatal-safe guidance only");
      tags.push("safety");
    }

    if (!issues.length) continue;

    let suggestedAction = "Review athlete profile and send a short check-in.";
    if (tags.includes("injury")) suggestedAction = "Confirm pain status and adjust training load.";
    else if (tags.includes("illness")) suggestedAction = "Ask about symptoms and pause hard training if needed.";
    else if (tags.includes("nutrition")) suggestedAction = "Remind to log meals and review protein target.";
    else if (tags.includes("inactive")) suggestedAction = "Re-engage with a simple next session plan.";
    else if (tags.includes("performance")) suggestedAction = "Discuss recovery, sleep, and session difficulty.";

    items.push({
      athleteId: a.athleteId,
      name: a.name,
      priority: priorityFrom(issues, tags),
      issues,
      suggestedAction,
      tags: [...new Set(tags)],
    });
  }

  const rank = { high: 0, normal: 1, low: 2 };
  items.sort((x, y) => rank[x.priority] - rank[y.priority] || x.name.localeCompare(y.name));
  return items;
}
