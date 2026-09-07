import { randomBytes } from "crypto";
import { prisma } from "@/lib/db";
import { AuthError } from "@/lib/authz";
import type { Role } from "@prisma/client";

/** Get (or lazily create) a user's personal, shareable connect code. */
export async function getOrCreateConnectCode(userId: string): Promise<string> {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: { connectCode: true },
  });
  if (profile?.connectCode) return profile.connectCode;

  // Generate a short, human-friendly code and ensure uniqueness.
  for (let i = 0; i < 5; i++) {
    const code = randomBytes(4).toString("hex").toUpperCase(); // 8 chars
    try {
      await prisma.profile.update({ where: { userId }, data: { connectCode: code } });
      return code;
    } catch {
      // unique collision — retry
    }
  }
  throw new Error("Could not generate a connect code");
}

/** Resolve a target user by email or connect code. Throws AuthError(404) if not found. */
export async function resolveTarget(opts: { email?: string; code?: string }): Promise<{ id: string; role: Role }> {
  if (opts.code) {
    const profile = await prisma.profile.findUnique({
      where: { connectCode: opts.code.trim().toUpperCase() },
      select: { userId: true, user: { select: { role: true } } },
    });
    if (!profile) throw new AuthError(404, "No account found for that connect code");
    return { id: profile.userId, role: profile.user.role };
  }
  if (opts.email) {
    const user = await prisma.user.findUnique({
      where: { email: opts.email.trim().toLowerCase() },
      select: { id: true, role: true },
    });
    if (!user) throw new AuthError(404, "No account found with that email");
    return { id: user.id, role: user.role };
  }
  throw new AuthError(400, "Provide an email or a connect code");
}

/**
 * Given the current user (with role) and a target user (with role), work out
 * which one is the coach and which is the athlete for a CoachAthleteRelation.
 * Exactly one side must be a coach and the other a non-coach ("user").
 */
export function orientRelation(
  me: { id: string; role: Role },
  target: { id: string; role: Role },
): { coachId: string; athleteId: string } {
  const meIsCoach = me.role === "coach" || me.role === "admin";
  const targetIsCoach = target.role === "coach" || target.role === "admin";

  if (meIsCoach && !targetIsCoach) return { coachId: me.id, athleteId: target.id };
  if (!meIsCoach && targetIsCoach) return { coachId: target.id, athleteId: me.id };

  if (meIsCoach && targetIsCoach) {
    throw new AuthError(400, "Both accounts are coaches — connect a coach with an athlete");
  }
  throw new AuthError(400, "Neither account is a coach — an athlete must connect with a coach");
}
