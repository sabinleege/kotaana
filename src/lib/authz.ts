import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import type { Role } from "@prisma/client";

/** Thrown by the guards below; API routes translate this into an HTTP status. */
export class AuthError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "AuthError";
  }
}

export type SessionUser = { id: string; role: Role; email?: string | null; name?: string | null };

/** Require any authenticated user. Throws AuthError(401) otherwise. */
export async function requireUser(): Promise<SessionUser> {
  const session = await auth();
  if (!session?.user?.id) throw new AuthError(401, "Not authenticated");
  return {
    id: session.user.id,
    role: session.user.role,
    email: session.user.email,
    name: session.user.name,
  };
}

/** Require an authenticated user holding one of the given roles. */
export async function requireRole(...roles: Role[]): Promise<SessionUser> {
  const user = await requireUser();
  if (!roles.includes(user.role)) {
    throw new AuthError(403, "Insufficient role");
  }
  return user;
}

/**
 * Does `coachId` actively coach `athleteId`?
 * This is the server-side replacement for the Supabase `coaches_athlete()` RLS helper.
 */
export async function coachesAthlete(
  coachId: string,
  athleteId: string,
): Promise<boolean> {
  const rel = await prisma.coachAthleteRelation.findUnique({
    where: { coachId_athleteId: { coachId, athleteId } },
    select: { status: true },
  });
  return rel?.status === "active";
}

/** Assert the current coach may access the given athlete; throws AuthError(403) if not. */
export async function requireCoachOfAthlete(
  coachId: string,
  athleteId: string,
): Promise<void> {
  if (coachId === athleteId) return;
  const ok = await coachesAthlete(coachId, athleteId);
  if (!ok) throw new AuthError(403, "Not linked to this athlete");
}
