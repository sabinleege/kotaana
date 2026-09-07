/**
 * Injury medical timeline — weeks, restrictions, recovery estimate.
 */
import { prisma } from "@/lib/db";

export type TimelineWeek = {
  week: number;
  focus: string;
  restrictions: string;
  milestone?: string;
};

export function estimateRecoveryMonths(severity: number, injuryType: string): number {
  const t = injuryType.toLowerCase();
  if (t.includes("acl")) return 6 + Math.max(0, severity - 3);
  if (t.includes("fracture") || t.includes("break")) return 3 + severity * 0.5;
  if (t.includes("sprain") || t.includes("strain")) return 0.5 + severity * 0.35;
  if (t.includes("tendon")) return 2 + severity * 0.4;
  return 1 + severity * 0.5;
}

export function buildDefaultTimeline(severity: number, injuryType: string, bodyPart: string): TimelineWeek[] {
  const months = estimateRecoveryMonths(severity, injuryType);
  const weeks = Math.max(4, Math.round(months * 4));
  const out: TimelineWeek[] = [];
  for (let w = 1; w <= Math.min(weeks, 16); w++) {
    const phase = w <= 2 ? "Protect & reduce pain" : w <= weeks * 0.4 ? "Mobility" : w <= weeks * 0.7 ? "Strength rebuild" : "Return to load";
    const restrictions =
      w <= 2
        ? `Avoid loading ${bodyPart}; no deep flexion under load`
        : w <= weeks * 0.5
          ? `Limited load on ${bodyPart}; no maximal lifts`
          : `Progressive load on ${bodyPart}; stop if sharp pain`;
    out.push({
      week: w,
      focus: phase,
      restrictions,
      milestone: w === weeks ? "Target return window" : undefined,
    });
  }
  return out;
}

export async function ensureInjuryTimeline(injuryId: string) {
  const injury = await prisma.injury.findUnique({ where: { id: injuryId } });
  if (!injury) return null;
  if (injury.recoveryTimeline) return injury;

  const timeline = buildDefaultTimeline(injury.severity, injury.injuryType, injury.bodyPart);
  const months = estimateRecoveryMonths(injury.severity, injury.injuryType);
  const expected = new Date(injury.dateReported);
  expected.setMonth(expected.getMonth() + Math.ceil(months));

  return prisma.injury.update({
    where: { id: injuryId },
    data: {
      recoveryTimeline: timeline as any,
      expectedReturn: injury.expectedReturn || expected,
      restrictions:
        injury.restrictions ||
        `Active ${injury.bodyPart} ${injury.injuryType} — follow week-1 restrictions until reassessed`,
      healingPercent: injury.healingPercent ?? 5,
    },
  });
}

export function currentWeekIndex(dateReported: Date, timeline: TimelineWeek[]): TimelineWeek | null {
  if (!timeline?.length) return null;
  const weeksSince = Math.floor((Date.now() - dateReported.getTime()) / (7 * 86400000)) + 1;
  return timeline.find((t) => t.week === weeksSince) || timeline[timeline.length - 1];
}
