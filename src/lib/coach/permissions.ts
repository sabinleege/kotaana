/**
 * Athlete → coach data permissions.
 *
 * An athlete sets these in /app/settings → "Privacy & permissions". A linked
 * coach only sees the categories the athlete has left enabled. Being linked
 * ("active" relation) grants access to the athlete at all; these decide how
 * much of them a coach sees.
 *
 * Default is ALLOW: an athlete who has never opened the screen is treated as
 * sharing everything, which matches what the settings UI shows them
 * (`stored[k] !== false`). Only an explicit `false` hides a category, so the
 * stored shape and the UI can never disagree about what a blank value means.
 */

import { prisma } from "@/lib/db";

export const COACH_PERMS = [
  "weight",
  "body_measurements",
  "workout_history",
  "nutrition",
  "water",
  "health",
  "injuries",
  "sleep",
  "progress_photos",
  "menstrual_cycle",
  "diseases",
  "medication",
  "subscription",
  "location",
  "online_status",
] as const;

export type CoachPerm = (typeof COACH_PERMS)[number];

export type PermissionSet = {
  can: (perm: CoachPerm) => boolean;
  /** Raw map, for returning to the athlete's own settings screen. */
  raw: Record<string, boolean>;
};

function toSet(stored: unknown): PermissionSet {
  const raw: Record<string, boolean> = {};
  const obj = stored && typeof stored === "object" ? (stored as Record<string, unknown>) : {};
  for (const k of COACH_PERMS) raw[k] = obj[k] !== false;
  return { can: (perm) => raw[perm] !== false, raw };
}

/** Permissions for one athlete. */
export async function permissionsFor(athleteId: string): Promise<PermissionSet> {
  const profile = await prisma.profile.findUnique({
    where: { userId: athleteId },
    select: { coachPermissions: true },
  });
  return toSet(profile?.coachPermissions);
}

/** Permissions for many athletes at once — avoids N queries on roster views. */
export async function permissionsForMany(
  athleteIds: string[],
): Promise<Map<string, PermissionSet>> {
  if (athleteIds.length === 0) return new Map();
  const rows = await prisma.profile.findMany({
    where: { userId: { in: athleteIds } },
    select: { userId: true, coachPermissions: true },
  });
  const byId = new Map(rows.map((r) => [r.userId, toSet(r.coachPermissions)]));
  // Athletes with no profile row still get the permissive default.
  for (const id of athleteIds) if (!byId.has(id)) byId.set(id, toSet(null));
  return byId;
}

/**
 * Drop the fields a coach isn't allowed to see.
 *
 * Returns a `hidden` list rather than silently removing things, so the coach UI
 * can say "the athlete has not shared this" instead of showing a blank that
 * reads like missing data.
 */
export function applyPermissions<T extends Record<string, unknown>>(
  payload: T,
  perms: PermissionSet,
  fieldMap: Partial<Record<CoachPerm, (keyof T)[]>>,
): T & { hidden: CoachPerm[] } {
  const out = { ...payload } as T & { hidden: CoachPerm[] };
  const hidden: CoachPerm[] = [];

  for (const [perm, fields] of Object.entries(fieldMap) as [CoachPerm, (keyof T)[]][]) {
    if (perms.can(perm)) continue;
    hidden.push(perm);
    for (const f of fields) (out as Record<string, unknown>)[f as string] = null;
  }

  out.hidden = hidden;
  return out;
}
